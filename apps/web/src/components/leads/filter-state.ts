import type { LeadStatus, OpportunityTier } from '@geoscout/shared';

/** Client-side rule-builder state. Mirrors LeadFilter but all-optional UI fields. */
export interface FilterState {
  search: string;
  category: string;
  city: string;
  state: string;
  country: string;
  reviewsMin: string;
  reviewsMax: string;
  ratingMin: string;
  website: 'any' | 'has' | 'none';
  hasPhone: boolean;
  hasEmail: boolean;
  instagram: boolean;
  facebook: boolean;
  linkedin: boolean;
  opportunity?: OpportunityTier;
  status?: LeadStatus;
  sort: 'updatedAt' | 'reviewCount' | 'rating' | 'opportunityScore' | 'name';
  order: 'asc' | 'desc';
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: '',
  city: '',
  state: '',
  country: '',
  reviewsMin: '',
  reviewsMax: '',
  ratingMin: '',
  website: 'any',
  hasPhone: false,
  hasEmail: false,
  instagram: false,
  facebook: false,
  linkedin: false,
  opportunity: undefined,
  status: undefined,
  sort: 'updatedAt',
  order: 'desc',
};

/** Serialize filter state → query params for /api/businesses. */
export function filtersToParams(
  f: FilterState,
  page: number,
  pageSize: number,
  includeArchived = false,
): URLSearchParams {
  const p = new URLSearchParams();
  if (f.search) p.set('search', f.search);
  if (f.category) p.set('category', f.category);
  if (f.city) p.set('city', f.city);
  if (f.state) p.set('state', f.state);
  if (f.country) p.set('country', f.country);
  if (f.reviewsMin) p.set('reviewsMin', f.reviewsMin);
  if (f.reviewsMax) p.set('reviewsMax', f.reviewsMax);
  if (f.ratingMin) p.set('ratingMin', f.ratingMin);
  if (f.website !== 'any') p.set('website', f.website);
  if (f.hasPhone) p.set('hasPhone', 'true');
  if (f.hasEmail) p.set('hasEmail', 'true');
  if (f.instagram) p.set('instagram', 'true');
  if (f.facebook) p.set('facebook', 'true');
  if (f.linkedin) p.set('linkedin', 'true');
  if (f.opportunity) p.set('opportunity', f.opportunity);
  if (f.status) p.set('status', f.status);
  if (includeArchived) p.set('includeArchived', 'true');
  p.set('sort', f.sort);
  p.set('order', f.order);
  p.set('page', String(page));
  p.set('pageSize', String(pageSize));
  return p;
}

/** Count of active (non-default) filters, for the "Active filters" badge. */
export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.search) n++;
  if (f.category) n++;
  if (f.city) n++;
  if (f.state) n++;
  if (f.country) n++;
  if (f.reviewsMin) n++;
  if (f.reviewsMax) n++;
  if (f.ratingMin) n++;
  if (f.website !== 'any') n++;
  if (f.hasPhone) n++;
  if (f.hasEmail) n++;
  if (f.instagram) n++;
  if (f.facebook) n++;
  if (f.linkedin) n++;
  if (f.opportunity) n++;
  if (f.status) n++;
  return n;
}
