import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { LEAD_STATUSES, SCAN_JOB_STATUSES, USER_ROLES } from '@geoscout/shared';
import type { Socials } from '@geoscout/shared';

export const leadStatusEnum = pgEnum('lead_status', LEAD_STATUSES);
export const scanJobStatusEnum = pgEnum('scan_job_status', SCAN_JOB_STATUSES);
export const userRoleEnum = pgEnum('user_role', USER_ROLES);

/**
 * Team members. The dataset is shared — everyone sees every lead — but actions
 * are attributed back to a user. Each user also has a personal `apiKey` that
 * their Chrome extension sends, so scans/leads are credited to the right person.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('member'),
    apiKey: text('api_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique').on(t.email),
    apiKeyUnique: uniqueIndex('users_api_key_unique').on(t.apiKey),
  }),
);

/**
 * The canonical, deduped business record. One row per Google `place_id`.
 * `status`, `notes`, `isArchived`, `assignedTo`, and `createdBy` are user-owned
 * and NEVER overwritten by a scan — scans only refresh Google-sourced fields.
 */
export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    placeId: text('place_id').notNull(),

    name: text('name').notNull(),
    category: text('category'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    country: text('country'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),

    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    hasWebsite: boolean('has_website').notNull().default(false),

    rating: numeric('rating', { precision: 2, scale: 1 }),
    reviewCount: integer('review_count').notNull().default(0),
    priceLevel: text('price_level'),
    hours: jsonb('hours').$type<Record<string, string>>(),
    socials: jsonb('socials').$type<Socials>(),

    googleUrl: text('google_url'),
    opportunityScore: integer('opportunity_score').notNull().default(0),

    // User-owned lifecycle fields — never touched by a scan.
    status: leadStatusEnum('status').notNull().default('active'),
    notes: text('notes'),
    isArchived: boolean('is_archived').notNull().default(false),

    // Attribution — who first added it, and who's actively working it.
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),

    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastScannedAt: timestamp('last_scanned_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    placeIdUnique: uniqueIndex('businesses_place_id_unique').on(t.placeId),
    cityIdx: index('businesses_city_idx').on(t.city),
    categoryIdx: index('businesses_category_idx').on(t.category),
    statusIdx: index('businesses_status_idx').on(t.status),
    reviewIdx: index('businesses_review_count_idx').on(t.reviewCount),
  }),
);

/**
 * Time series of review/rating snapshots — one row appended per scan when the
 * numbers change, so the dashboard can chart review growth over time.
 */
export const businessScanHistory = pgTable(
  'business_scan_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
    reviewCount: integer('review_count').notNull().default(0),
    rating: numeric('rating', { precision: 2, scale: 1 }),
  },
  (t) => ({
    businessIdx: index('scan_history_business_idx').on(t.businessId),
  }),
);

/** A comment thread per lead — every comment attributed to its author. */
export const leadComments = pgTable(
  'lead_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('lead_comments_business_idx').on(t.businessId),
  }),
);

/** One row per scan run — attributed to the user whose API key ran it. */
export const scanJobs = pgTable('scan_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  query: text('query').notNull(),
  category: text('category'),
  area: text('area'),
  source: text('source').notNull().default('extension'),
  status: scanJobStatusEnum('status').notNull().default('running'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  foundCount: integer('found_count').notNull().default(0),
  newCount: integer('new_count').notNull().default(0),
  updatedCount: integer('updated_count').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

/** Saved rule-builder filter sets. `filters` is the LeadFilter shape. */
export const filterTemplates = pgTable('filter_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  filters: jsonb('filters').notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Supabase Storage file pointers attached to a business. */
export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    fileKey: text('file_key').notNull(),
    fileName: text('file_name').notNull(),
    mime: text('mime'),
    size: integer('size'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('attachments_business_idx').on(t.businessId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type ScanJob = typeof scanJobs.$inferSelect;
export type FilterTemplate = typeof filterTemplates.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type ScanHistoryRow = typeof businessScanHistory.$inferSelect;
export type LeadComment = typeof leadComments.$inferSelect;
