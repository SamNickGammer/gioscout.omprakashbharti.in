import { z } from 'zod';

/**
 * Socials extracted from a place's detail panel / website links.
 */
export const socialsSchema = z.object({
  instagram: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
});
export type Socials = z.infer<typeof socialsSchema>;

/**
 * A single scraped business as sent by the Chrome extension.
 *
 * `placeId` is Google's STABLE identifier (the `0x…:0x…` feature hex or CID
 * pulled from the place URL). It is the dedup key — a business exists exactly
 * once in the database, keyed by this value.
 */
export const scrapedBusinessSchema = z.object({
  placeId: z.string().min(1, 'placeId is required'),
  name: z.string().min(1, 'name is required'),
  category: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).optional().nullable(),
  priceLevel: z.string().optional().nullable(),
  hours: z.record(z.string(), z.string()).optional().nullable(),
  socials: socialsSchema.optional().nullable(),
  googleUrl: z.string().optional().nullable(),
});
export type ScrapedBusiness = z.infer<typeof scrapedBusinessSchema>;

/**
 * Payload posted to POST /api/ingest. The extension batches scraped
 * businesses and (optionally) ties them to an open scan job.
 */
export const ingestPayloadSchema = z.object({
  scanJobId: z.string().uuid().optional().nullable(),
  query: z.string().optional().nullable(),
  businesses: z.array(scrapedBusinessSchema).min(1).max(200),
});
export type IngestPayload = z.infer<typeof ingestPayloadSchema>;

export const ingestResultSchema = z.object({
  received: z.number().int(),
  created: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
});
export type IngestResult = z.infer<typeof ingestResultSchema>;
