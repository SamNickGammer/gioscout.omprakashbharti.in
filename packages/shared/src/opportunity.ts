import type { OpportunityTier } from './status';

export interface OpportunitySignals {
  reviewCount?: number | null;
  rating?: number | null;
  website?: string | null;
}

/**
 * Heuristic "is this a good prospect for a website/automation pitch?" score
 * (0–100). The thesis: a business that is clearly successful (enough reviews,
 * strong rating) but has NO website is the hottest lead. Tunable in one place
 * so both the API and any future UI agree.
 */
export function computeOpportunityScore(s: OpportunitySignals): number {
  const reviews = s.reviewCount ?? 0;
  const rating = s.rating ?? 0;
  const hasWebsite = !!s.website && s.website.trim().length > 0;

  // Traction: reviews on a log curve, capped. 500+ reviews ≈ full marks.
  const traction = Math.min(1, Math.log10(reviews + 1) / Math.log10(501));

  // Quality: rating from 3.5 → 5.0 mapped to 0 → 1.
  const quality = Math.max(0, Math.min(1, (rating - 3.5) / 1.5));

  // Need: no website is the strongest buy signal.
  const need = hasWebsite ? 0.2 : 1;

  const score = 100 * (0.4 * traction + 0.25 * quality + 0.35 * need);
  return Math.round(score);
}

export function opportunityTier(score: number): OpportunityTier {
  if (score >= 66) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
