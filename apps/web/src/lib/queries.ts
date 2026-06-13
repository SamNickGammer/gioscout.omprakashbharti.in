import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import type { LeadFilter } from '@geoscout/shared';
import { db } from '@/db';
import {
  attachments,
  businesses,
  businessScanHistory,
  type Business,
} from '@/db/schema';

const SORT_COLUMNS = {
  updatedAt: businesses.updatedAt,
  reviewCount: businesses.reviewCount,
  rating: businesses.rating,
  opportunityScore: businesses.opportunityScore,
  name: businesses.name,
} as const;

function buildWhere(f: LeadFilter): SQL | undefined {
  const clauses: (SQL | undefined)[] = [];

  // Archive: the main views hide archived; the archive view flips this.
  if (f.includeArchived) {
    clauses.push(eq(businesses.isArchived, true));
  } else {
    clauses.push(eq(businesses.isArchived, false));
  }

  if (f.search) {
    const term = `%${f.search}%`;
    clauses.push(
      or(
        ilike(businesses.name, term),
        ilike(businesses.address, term),
        ilike(businesses.category, term),
      ),
    );
  }
  if (f.category) clauses.push(ilike(businesses.category, `%${f.category}%`));
  if (f.city) clauses.push(ilike(businesses.city, `%${f.city}%`));
  if (f.state) clauses.push(ilike(businesses.state, `%${f.state}%`));
  if (f.country) clauses.push(ilike(businesses.country, `%${f.country}%`));

  if (f.reviewsMin != null) clauses.push(gte(businesses.reviewCount, f.reviewsMin));
  if (f.reviewsMax != null) clauses.push(lte(businesses.reviewCount, f.reviewsMax));
  if (f.ratingMin != null) clauses.push(sql`${businesses.rating} >= ${f.ratingMin}`);

  if (f.website === 'has') clauses.push(eq(businesses.hasWebsite, true));
  if (f.website === 'none') clauses.push(eq(businesses.hasWebsite, false));

  if (f.hasPhone) clauses.push(sql`${businesses.phone} is not null and ${businesses.phone} <> ''`);
  if (f.hasEmail) clauses.push(sql`${businesses.email} is not null and ${businesses.email} <> ''`);

  if (f.instagram) clauses.push(sql`${businesses.socials} ->> 'instagram' is not null`);
  if (f.facebook) clauses.push(sql`${businesses.socials} ->> 'facebook' is not null`);
  if (f.linkedin) clauses.push(sql`${businesses.socials} ->> 'linkedin' is not null`);

  if (f.opportunity === 'high') clauses.push(gte(businesses.opportunityScore, 66));
  if (f.opportunity === 'medium')
    clauses.push(and(gte(businesses.opportunityScore, 40), lte(businesses.opportunityScore, 65)));
  if (f.opportunity === 'low') clauses.push(lte(businesses.opportunityScore, 39));

  if (f.status) clauses.push(eq(businesses.status, f.status));

  return and(...clauses.filter(Boolean));
}

export interface ListResult {
  rows: Business[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listBusinesses(f: LeadFilter): Promise<ListResult> {
  const where = buildWhere(f);
  const sortCol = SORT_COLUMNS[f.sort] ?? businesses.updatedAt;
  const orderBy = f.order === 'asc' ? asc(sortCol) : desc(sortCol);
  const offset = (f.page - 1) * f.pageSize;

  const [rows, countRows] = await Promise.all([
    db.select().from(businesses).where(where).orderBy(orderBy).limit(f.pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(businesses).where(where),
  ]);

  return {
    rows,
    total: countRows[0]?.count ?? 0,
    page: f.page,
    pageSize: f.pageSize,
  };
}

export async function getBusinessDetail(id: string) {
  const [row] = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  if (!row) return null;

  const [history, files] = await Promise.all([
    db
      .select()
      .from(businessScanHistory)
      .where(eq(businessScanHistory.businessId, id))
      .orderBy(asc(businessScanHistory.scannedAt)),
    db.select().from(attachments).where(eq(attachments.businessId, id)),
  ]);

  return { business: row, history, attachments: files };
}

export interface DashboardStats {
  total: number;
  noWebsite: number;
  highOpportunity: number;
  clients: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*) filter (where not is_archived)::int`,
      noWebsite: sql<number>`count(*) filter (where not is_archived and not has_website)::int`,
      highOpportunity: sql<number>`count(*) filter (where not is_archived and opportunity_score >= 66)::int`,
      clients: sql<number>`count(*) filter (where status = 'client')::int`,
    })
    .from(businesses);
  return row ?? { total: 0, noWebsite: 0, highOpportunity: 0, clients: 0 };
}
