/**
 * Extracts Google's STABLE place identifier — the `0x…:0x…` feature id — from a
 * Maps place URL. This is the dedup key. Also pulls lat/lng when present.
 */
export function extractPlaceId(href: string | null | undefined): string | null {
  if (!href) return null;
  // The "!1s0x...:0x..." token in the data payload is the stable feature id.
  const feature = href.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (feature) return feature[1];

  // Fallback: a ?cid= query param (also stable).
  const cid = href.match(/[?&]cid=(\d+)/);
  if (cid) return `cid:${cid[1]}`;

  return null;
}

export function extractLatLng(href: string | null | undefined): { lat?: number; lng?: number } {
  if (!href) return {};
  const m = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  // The "!3d<lat>!4d<lng>" tokens are the place's own coordinates.
  const d = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (d) return { lat: parseFloat(d[1]), lng: parseFloat(d[2]) };
  return {};
}
