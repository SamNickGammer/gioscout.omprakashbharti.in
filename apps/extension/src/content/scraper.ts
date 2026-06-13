import type { ScrapedBusiness } from '../lib/types';
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

function isRatingish(s: string): boolean {
  return /\(\s*\d[\d,.]*\s*\)/.test(s) || /^\d(\.\d)?★?$/.test(s) || /^\d(\.\d)?\(/.test(s);
}

function isHoursish(s: string): boolean {
  return (
    /\b(open|opens|closed|closes|24\s*hours|permanently closed|temporarily closed)\b/i.test(s) ||
    /\b\d{1,2}(:\d{2})?\s*[ap]\.?m\.?\b/i.test(s)
  );
}

function isPrice(s: string): boolean {
  return /^[₹$€£]{1,4}$/.test(s) || /^[₹$€£]{1,4}\d/.test(s) || /^\$\$+$/.test(s);
}

/** A price RANGE like "₹400–1,600 per person". */
function priceText(s: string): boolean {
  return /[₹$€£]\s?\d[\d,]*\s*(–|-|to)\s*[₹$€£]?\s?\d/.test(s) || /^[₹$€£]\s?\d[\d,]*/.test(s);
}

function cityFromQuery(query: string): string | null {
  const m = query.match(/\bin\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function ariaValue(el: Element | null, prefix: string): string | null {
  const a = el?.getAttribute('aria-label') ?? '';
  const m = a.match(new RegExp(`${prefix}:\\s*(.+)$`, 'i'));
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
  private hooks!: ScrapeHooks;

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

  private hooksStop() {
    return this.hooks?.shouldStop?.() ?? false;
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

      const ended = pickAll(feed, 'endSentinel').some((e) =>
        /reached the end/i.test(e.textContent ?? ''),
      );
      if (ended) break;

      if (feed.scrollHeight === lastHeight) {
        stagnant++;
        if (stagnant >= 4) break;
      } else {
        stagnant = 0;
        lastHeight = feed.scrollHeight;
      }
    }
  }

  /** Parse a result card (name, rating, reviews, category, address, place id). */
  private parseCard(card: Element, query: string): ScrapedBusiness | null {
    const link = pick(card, 'cardLink') as HTMLAnchorElement | null;
    const href = link?.href ?? null;
    const placeId = extractPlaceId(href);
    if (!placeId) return null;

    const name = text(pick(card, 'cardName')) || link?.getAttribute('aria-label') || '';
    if (!name) return null;

    const rating = parseFloat(text(pick(card, 'cardRating'))) || null;
    const reviewCount = digits(text(pick(card, 'cardReviews'))) ?? 0;

    const leafSel = SELECTORS.cardInfoRows[0];
    const leafRows = pickAll(card, 'cardInfoRows').filter(
      (el) => el.querySelectorAll(leafSel).length === 0,
    );
    const rows = leafRows.map((r) =>
      text(r)
        .split('·')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const flat = rows.flat();

    const priceLevel = flat.find(isPrice) ?? null;
    const category =
      rows[0]?.find((s) => !isRatingish(s) && !isHoursish(s) && !isPrice(s)) ?? null;
    const addrRow = rows[1] ?? rows[0] ?? [];
    const address =
      addrRow.find(
        (s) => s !== category && !isRatingish(s) && !isHoursish(s) && !isPrice(s),
      ) ?? null;

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
      priceLevel,
      hours: null,
      socials: null,
      googleUrl: href,
    };
  }

  private extractPhone(el: Element | null): string | null {
    if (!el) return null;
    const id = el.getAttribute('data-item-id') ?? '';
    const m = id.match(/tel:(.+)$/);
    if (m) return m[1].trim();
    const aria = ariaValue(el, 'Phone');
    if (aria) return aria;
    const t = text(el);
    return /\d{4,}/.test(t) ? t : null;
  }

  private findPrice(root: ParentNode): string | null {
    const nodes = Array.from(root.querySelectorAll('span, button'));
    for (const n of nodes) {
      const t = text(n);
      if (t && t.length < 40 && priceText(t)) return t;
    }
    return null;
  }

  /** Re-find a card by its Place ID (DOM nodes are recreated after back-nav). */
  private async findCardByPlaceId(placeId: string): Promise<Element | null> {
    const feed = this.getFeed();
    for (let attempt = 0; attempt < 10 && !this.stopped; attempt++) {
      const cards = pickAll(feed ?? document, 'card');
      for (const card of cards) {
        const a = pick(card, 'cardLink') as HTMLAnchorElement | null;
        if (a && extractPlaceId(a.href) === placeId) return card;
      }
      // Not rendered yet — scroll the list to load more and retry.
      if (feed) feed.scrollBy({ top: 800 });
      await sleep(250);
    }
    return null;
  }

  private async waitFeed(): Promise<void> {
    for (let i = 0; i < 30 && !this.stopped; i++) {
      if (/\/maps\/search\//.test(location.href) || this.getFeed()) return;
      await sleep(150);
    }
  }

  /**
   * Open a place's detail panel and capture EVERYTHING: website, phone, email,
   * exact address, category, price, coordinates. Reads from the live document
   * (the open place panel is the page's main content) and uses the URL turning
   * into /maps/place/ as the reliable "detail loaded" signal.
   */
  private async deepEnrich(biz: ScrapedBusiness): Promise<void> {
    const card = await this.findCardByPlaceId(biz.placeId);
    const link = card ? (pick(card, 'cardLink') as HTMLAnchorElement | null) : null;
    if (!link) return;

    (link as HTMLElement).scrollIntoView({ block: 'center' });
    await sleep(150);
    link.click();

    // Wait until the place panel is actually open (URL becomes /maps/place/…).
    for (let i = 0; i < 45 && !this.stopped; i++) {
      await sleep(150);
      if (/\/maps\/place\//.test(location.href)) break;
    }
    // Let the action buttons (website/phone/email) finish rendering.
    await sleep(550);

    const websiteEl = document.querySelector<HTMLAnchorElement>(
      'a[data-item-id="authority"], a[data-item-id^="authority"], a[aria-label^="Website:"]',
    );
    if (websiteEl?.href) biz.website = websiteEl.href;

    const phoneEl = document.querySelector(
      'button[data-item-id^="phone:tel:"], button[data-item-id^="phone"], button[aria-label^="Phone:"]',
    );
    const phone = this.extractPhone(phoneEl);
    if (phone) biz.phone = phone;

    const addrEl = document.querySelector(
      'button[data-item-id="address"], button[aria-label^="Address:"]',
    );
    const addr = ariaValue(addrEl, 'Address') ?? (addrEl ? text(addrEl) : null);
    if (addr) biz.address = addr;

    const catEl = document.querySelector('button[jsaction*="category"]');
    const cat = text(catEl);
    if (cat && !isRatingish(cat) && !isHoursish(cat)) biz.category = cat;

    const emailEl = document.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
    if (emailEl?.href) biz.email = emailEl.href.replace(/^mailto:/i, '').split('?')[0].trim();

    const main = document.querySelector('div[role="main"]') ?? document.body;
    const price = this.findPrice(main);
    if (price) biz.priceLevel = price;

    const ll = extractLatLng(location.href);
    if (ll.lat != null && ll.lng != null) {
      biz.lat = ll.lat;
      biz.lng = ll.lng;
    }

    // Return to the results list and wait for it to come back.
    history.back();
    await this.waitFeed();
    await sleep(450);
  }

  async run(hooks: ScrapeHooks): Promise<number> {
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

    // Phase 1: shallow-parse every card up front (stable — no navigation yet).
    const items: ScrapedBusiness[] = [];
    for (const card of pickAll(this.getFeed() ?? document, 'card')) {
      const biz = this.parseCard(card, query);
      if (biz && !this.seen.has(biz.placeId)) {
        this.seen.add(biz.placeId);
        items.push(biz);
      }
    }
    hooks.onProgress(0, `Found ${items.length} places · fetching details…`);

    // Phase 2: deep-enrich each by re-finding its card (survives DOM re-render).
    let batch: ScrapedBusiness[] = [];
    let found = 0;

    for (const biz of items) {
      if (this.stopped || hooks.shouldStop()) break;
      try {
        await this.deepEnrich(biz);
      } catch {
        /* best-effort; keep shallow data */
      }

      batch.push(biz);
      found++;
      hooks.onProgress(found, `Scraped ${found} / ${items.length}`);

      if (batch.length >= 8) {
        await hooks.onBatch(batch);
        batch = [];
      }
    }

    if (batch.length) await hooks.onBatch(batch);
    return found;
  }
}
