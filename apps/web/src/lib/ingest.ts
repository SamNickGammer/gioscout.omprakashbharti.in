import { inArray, sql } from 'drizzle-orm';
import {
  computeOpportunityScore,
  type ScrapedBusiness,
  type IngestResult,
} from '@geoscout/shared';
import { db } from '@/db';
import { businesses, businessScanHistory, type NewBusiness } from '@/db/schema';

function toRow(b: ScrapedBusiness, createdBy: string | null): NewBusiness {
  const website = b.website?.trim() || null;
  const hasWebsite = !!website;
  const reviewCount = b.reviewCount ?? 0;
  const rating = b.rating ?? null;
  return {
    placeId: b.placeId,
    createdBy,
    name: b.name,
    category: b.category ?? null,
    address: b.address ?? null,
    city: b.city ?? null,
    state: b.state ?? null,
    country: b.country ?? null,
    lat: b.lat ?? null,
    lng: b.lng ?? null,
    phone: b.phone ?? null,
    email: b.email ?? null,
    website,
    hasWebsite,
    rating: rating != null ? rating.toFixed(1) : null,
    reviewCount,
    priceLevel: b.priceLevel ?? null,
    hours: b.hours ?? null,
    socials: b.socials ?? null,
    googleUrl: b.googleUrl ?? null,
    opportunityScore: computeOpportunityScore({ reviewCount, rating, website }),
  };
}

/**
 * The dedup engine. A business exists exactly once, keyed by `place_id`:
 *  - new placeId  → insert + initial scan-history snapshot
 *  - known placeId → refresh Google-sourced fields (status/notes/archive
 *    preserved) + append a snapshot only when review_count/rating changed.
 *
 * Uses neon-http (no multi-statement transactions), so the work is done with a
 * small fixed number of set-based statements regardless of batch size.
 */
export async function ingestBusinesses(
  incoming: ScrapedBusiness[],
  createdBy: string | null = null,
): Promise<IngestResult> {
  // De-dupe within the batch itself (last write wins per placeId).
  const byPlaceId = new Map<string, ScrapedBusiness>();
  for (const b of incoming) byPlaceId.set(b.placeId, b);
  const unique = [...byPlaceId.values()];
  const placeIds = unique.map((b) => b.placeId);

  if (placeIds.length === 0) {
    return { received: incoming.length, created: 0, updated: 0, skipped: incoming.length };
  }

  // Snapshot of what already exists, to classify new/changed.
  const existingRows = await db
    .select({
      id: businesses.id,
      placeId: businesses.placeId,
      reviewCount: businesses.reviewCount,
      rating: businesses.rating,
    })
    .from(businesses)
    .where(inArray(businesses.placeId, placeIds));

  const existing = new Map(existingRows.map((r) => [r.placeId, r]));

  const rows = unique.map((b) => toRow(b, createdBy));

  // Single upsert for the whole batch. Conflict target = unique place_id.
  // NOTE: status, notes, is_archived, assigned_to, created_by, first_seen_at are
  // intentionally absent from the SET clause so a scan never clobbers user-owned
  // lifecycle/attribution data (created_by stays whoever first added the lead).
  const upserted = await db
    .insert(businesses)
    .values(rows)
    .onConflictDoUpdate({
      target: businesses.placeId,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        address: sql`excluded.address`,
        city: sql`excluded.city`,
        state: sql`excluded.state`,
        country: sql`excluded.country`,
        lat: sql`excluded.lat`,
        lng: sql`excluded.lng`,
        phone: sql`excluded.phone`,
        email: sql`excluded.email`,
        website: sql`excluded.website`,
        hasWebsite: sql`excluded.has_website`,
        rating: sql`excluded.rating`,
        reviewCount: sql`excluded.review_count`,
        priceLevel: sql`excluded.price_level`,
        hours: sql`excluded.hours`,
        socials: sql`excluded.socials`,
        googleUrl: sql`excluded.google_url`,
        opportunityScore: sql`excluded.opportunity_score`,
        lastSeenAt: sql`now()`,
        lastScannedAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: businesses.id, placeId: businesses.placeId });

  const idByPlaceId = new Map(upserted.map((r) => [r.placeId, r.id]));

  // Build scan-history snapshots: every NEW business gets an initial row;
  // existing ones only when review count or rating actually changed.
  const historyRows: { businessId: string; reviewCount: number; rating: string | null }[] = [];
  let created = 0;
  let updated = 0;

  for (const b of unique) {
    const id = idByPlaceId.get(b.placeId);
    if (!id) continue;
    const prev = existing.get(b.placeId);
    const reviewCount = b.reviewCount ?? 0;
    const rating = b.rating != null ? b.rating.toFixed(1) : null;

    if (!prev) {
      created++;
      historyRows.push({ businessId: id, reviewCount, rating });
    } else {
      updated++;
      const changed = prev.reviewCount !== reviewCount || (prev.rating ?? null) !== rating;
      if (changed) historyRows.push({ businessId: id, reviewCount, rating });
    }
  }

  if (historyRows.length > 0) {
    await db.insert(businessScanHistory).values(historyRows);
  }

  return {
    received: incoming.length,
    created,
    updated,
    skipped: incoming.length - unique.length,
  };
}
