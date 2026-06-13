import { z } from 'zod';
import { LEAD_STATUSES, OPPORTUNITY_TIERS } from './status';

/**
 * The rule-builder filter set. Applied SERVER-SIDE over already-stored raw
 * data, so the same scan can be re-sliced any number of ways without
 * rescanning Google Maps. Persisted verbatim as a filter template.
 */
export const leadFilterSchema = z.object({
  search: z.string().optional(), // free-text over name/address
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),

  reviewsMin: z.coerce.number().int().min(0).optional(),
  reviewsMax: z.coerce.number().int().min(0).optional(),
  ratingMin: z.coerce.number().min(0).max(5).optional(),

  website: z.enum(['any', 'has', 'none']).optional().default('any'),
  hasPhone: z.coerce.boolean().optional(),
  hasEmail: z.coerce.boolean().optional(),

  instagram: z.coerce.boolean().optional(),
  facebook: z.coerce.boolean().optional(),
  linkedin: z.coerce.boolean().optional(),

  opportunity: z.enum(OPPORTUNITY_TIERS).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),

  sort: z
    .enum(['updatedAt', 'reviewCount', 'rating', 'opportunityScore', 'name'])
    .optional()
    .default('updatedAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
});
export type LeadFilter = z.infer<typeof leadFilterSchema>;

export const filterTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  filters: leadFilterSchema.partial(),
});
export type FilterTemplateInput = z.infer<typeof filterTemplateSchema>;
