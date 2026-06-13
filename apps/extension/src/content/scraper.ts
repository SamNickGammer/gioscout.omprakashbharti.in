import type { ExtensionConfig, ScrapedBusiness } from '../lib/types';
import { SELECTORS, pick, pickAll } from './selectors';
import { extractLatLng, extractPlaceId } from './place-id';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function text(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}

function digits(s: string): number | null {
  const m = s.replace(/[,\s]/g, '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/** Best-effort: derive a city from a "<thing> in <place>" search query. */
function cityFromQuery(query: string): string | null {
  const m = query.match(/\bin\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export interface ScrapeHooks {
  onOpened: (query: string) => Promise<void>;
  onBatch: (businesses: ScrapedBusiness[]) => Promise<void>;
  onProgress: (found: number, message?: string) => void;
  shouldStop: () => boolean;
}

export class MapsScraper {
  private stopped = false;
  private seen = new Set<string>();

  stop() {
    this.stopped = true;
  }

  getQuery(): string {
    const input = document.querySelector<HTMLInputElement>('#searchboxinput');
    if (input?.value) return input.value.trim();
    const fromUrl = location.pathname.match(/\/maps\/search\/([^/]+)/);
    if (fromUrl) return decodeURIComponent(fromUrl[1].replace(/\+/g, ' ')).trim();
    return document.title.replace(/ - Google Maps$/, '').trim();
  }

  private getFeed(): HTMLElement | null {
    return pick(document, 'feed') as HTMLElement | null;
  }

  /** Scroll the results panel to the bottom, lazy-loading every card. */
  private async scrollToEnd(onTick: (count: number) => void): Promise<void> {
    const feed = this.getFeed();
    if (!feed) return;
    let lastHeight = 0;
    let stagnant = 0;

    while (!this.stopped && !this.hooksStop()) {
      feed.scrollTo({ top: feed.scrollHeight, behavior: 'instant' as ScrollBehavior });
      await sleep(900);
      onTick(pickAll(feed, 'card').length);

      // Reached the end-of-list sentinel?
      const ended = pickAll(feed, 'endSentinel').some((e) =>
        /reached the end/i.test(e.textContent ?? ''),
      );
      if (ended) break;

      if (feed.scrollHeight === lastHeight) {
        stagnant++;
        if (stagnant >= 4) break; // no growth after several tries
      } else {
        stagnant = 0;
        lastHeight = feed.scrollHeight;
      }
    }
  }

  private hooks!: ScrapeHooks;
  private hooksStop() {
    return this.hooks?.shouldStop?.() ?? false;
  }

  private parseCard(card: Element, query: string): ScrapedBusiness | null {
    const link = pick(card, 'cardLink') as HTMLAnchorElement | null;
    const href = link?.href ?? null;
    const placeId = extractPlaceId(href);
    if (!placeId) return null; // can't dedupe without a stable id

    const name = text(pick(card, 'cardName')) || link?.getAttribute('aria-label') || '';
    if (!name) return null;

    const rating = parseFloat(text(pick(card, 'cardRating'))) || null;
    const reviewCount = digits(text(pick(card, 'cardReviews'))) ?? 0;

    const rows = pickAll(card, 'cardInfoRows').map((r) => text(r));
    const firstRow = rows[0] ?? '';
    const secondRow = rows[1] ?? '';
    const category = firstRow.split('·')[0]?.trim() || null;
    // Address tends to be the trailing part of the first/second info row.
    const address =
      secondRow.split('·').slice(-1)[0]?.trim() ||
      firstRow.split('·').slice(1).join('·').trim() ||
      null;

    const websiteEl = pick(card, 'cardWebsite') as HTMLAnchorElement | null;
    const website = websiteEl?.href ?? null;

    const { lat, lng } = extractLatLng(href);

    return {
      placeId,
      name,
      category,
      address,
      city: cityFromQuery(query),
      state: null,
      country: null,
      lat: lat ?? null,
      lng: lng ?? null,
      phone: null,
      email: null,
      website,
      rating,
      reviewCount,
      priceLevel: null,
      hours: null,
      socials: null,
      googleUrl: href,
    };
  }

  /** Optional: open a card's detail panel to capture phone + exact website. */
  private async deepEnrich(card: Element, biz: ScrapedBusiness): Promise<void> {
    const link = pick(card, 'cardLink') as HTMLAnchorElement | null;
    if (!link) return;
    link.click();
    // Wait for the detail panel to populate.
    for (let i = 0; i < 20 && !this.stopped; i++) {
      await sleep(180);
      const panel = pick(document, 'detailPanel');
      if (panel && pick(panel, 'detailPhone')) break;
      if (panel && pick(panel, 'detailWebsite')) break;
    }
    const panel = pick(document, 'detailPanel');
    if (panel) {
      const websiteEl = pick(panel, 'detailWebsite') as HTMLAnchorElement | null;
      if (websiteEl?.href) biz.website = websiteEl.href;

      const phoneEl = pick(panel, 'detailPhone');
      const phoneId = phoneEl?.getAttribute('data-item-id') ?? '';
      const phoneMatch = phoneId.match(/tel:(.+)$/);
      if (phoneMatch) biz.phone = phoneMatch[1];
      else {
        const aria = phoneEl?.getAttribute('aria-label') ?? '';
        const m = aria.match(/Phone:\s*(.+)$/i);
        if (m) biz.phone = m[1].trim();
      }

      const addrEl = pick(panel, 'detailAddress');
      const addrAria = addrEl?.getAttribute('aria-label') ?? '';
      const am = addrAria.match(/Address:\s*(.+)$/i);
      if (am) biz.address = am[1].trim();
    }
    // Return to the results list.
    history.back();
    await sleep(700);
  }

  async run(config: ExtensionConfig, hooks: ScrapeHooks): Promise<number> {
    this.hooks = hooks;
    this.stopped = false;
    this.seen.clear();

    const query = this.getQuery();
    await hooks.onOpened(query);

    const feed = this.getFeed();
    if (!feed) {
      throw new Error('No results list found. Run a search on Google Maps first.');
    }

    await this.scrollToEnd((count) => hooks.onProgress(count, 'Loading results…'));

    const cards = pickAll(this.getFeed() ?? document, 'card');
    const cap = config.maxResults > 0 ? config.maxResults : cards.length;

    let batch: ScrapedBusiness[] = [];
    let found = 0;

    for (let i = 0; i < cards.length && i < cap; i++) {
      if (this.stopped || hooks.shouldStop()) break;
      const biz = this.parseCard(cards[i], query);
      if (!biz || this.seen.has(biz.placeId)) continue;
      this.seen.add(biz.placeId);

      if (config.deepScrape) {
        try {
          await this.deepEnrich(cards[i], biz);
        } catch {
          /* best-effort enrichment; keep shallow data */
        }
      }

      batch.push(biz);
      found++;
      hooks.onProgress(found, `Scraped ${found}`);

      if (batch.length >= 10) {
        await hooks.onBatch(batch);
        batch = [];
      }
    }

    if (batch.length) await hooks.onBatch(batch);
    return found;
  }
}
