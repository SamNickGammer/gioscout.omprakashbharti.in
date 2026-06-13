/**
 * Centralized Google Maps DOM selectors. Google ships obfuscated, churning
 * class names — when a scan stops finding data, this is the ONE file to fix.
 * Each entry lists a few fallbacks tried in order.
 */
export const SELECTORS = {
  /** The scrollable results list panel. */
  feed: ['div[role="feed"]'],

  /** Each business card inside the feed. */
  card: ['div.Nv2PK', 'div[role="feed"] > div > div[jsaction]'],

  /** The clickable anchor inside a card (href carries the Place feature id). */
  cardLink: ['a.hfpxzc', 'a[href*="/maps/place/"]'],

  /** Business name within a card. */
  cardName: ['.qBF1Pd', '.fontHeadlineSmall'],

  /** Star rating within a card. */
  cardRating: ['.MW4etd'],

  /** Review count within a card (shown in parentheses). */
  cardReviews: ['.UY7F9'],

  /** The two info rows (category · price, address · hours). */
  cardInfoRows: ['.W4Efsd'],

  /** A "Website" action button rendered on some cards. */
  cardWebsite: ['a[data-value="Website"]', 'a.lcr4fd[aria-label*="ebsite"]'],

  /** End-of-list sentinel text container. */
  endSentinel: ['.m6QErb .HlvSq', 'span.HlvSq'],

  // ── Detail panel (after clicking a card) ──────────────────────────────
  detailPanel: ['div[role="main"]'],
  detailName: ['h1.DUwDvf', 'h1'],
  detailWebsite: [
    'a[data-item-id="authority"]',
    'a[data-item-id^="authority"]',
    'a[aria-label^="Website:"]',
  ],
  detailPhone: [
    'button[data-item-id^="phone:tel:"]',
    'button[data-item-id^="phone"]',
    'button[aria-label^="Phone:"]',
    'a[aria-label^="Call "]',
  ],
  detailAddress: ['button[data-item-id="address"]', 'button[aria-label^="Address:"]'],
  detailPlusCode: ['button[data-item-id="oloc"]', 'button[aria-label^="Plus code:"]'],
  detailCategory: ['button[jsaction*="category"]'],
  detailEmail: ['a[href^="mailto:"]'],
} as const;

export function pick(root: ParentNode, key: keyof typeof SELECTORS): Element | null {
  for (const sel of SELECTORS[key]) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export function pickAll(root: ParentNode, key: keyof typeof SELECTORS): Element[] {
  for (const sel of SELECTORS[key]) {
    const els = root.querySelectorAll(sel);
    if (els.length) return Array.from(els);
  }
  return [];
}
