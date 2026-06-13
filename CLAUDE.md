# CLAUDE.md — GeoScout working context

> Living context doc for Claude Code. **Update this file whenever a structural
> change lands** (new package, new table, new top-level route, new env var,
> changed run command). Keep it accurate; it is the map future sessions read first.

## What this project is

GeoScout turns Google Maps into a continuously-refreshed lead database for selling
websites / automation services. A Chrome extension scrapes Maps search results and
streams them to a Next.js API; a dashboard slices the data with a rule-builder.

**Core invariant:** a business exists **exactly once**, keyed by Google's stable
`place_id`. Re-scanning updates the row + appends a scan-history snapshot — never a
duplicate. Nothing is hard-deleted; rows move through a status lifecycle and an
archive (soft-delete) view.

## Monorepo layout (yarn workspaces)

```
apps/web          @geoscout/web        Next.js 15 App Router — dashboard + API
apps/extension    @geoscout/extension  Manifest V3 Chrome extension (the scraper)
packages/shared   @geoscout/shared     zod schemas + TS types + enums (SINGLE SOURCE OF TRUTH)
assets/           logo.png, logofull.png
```

`packages/shared` is imported by BOTH sides. Validation schemas live here so the
extension and the API validate the identical payload. Never duplicate a type that
belongs in shared.

## Stack

- **DB**: Supabase Postgres + Drizzle ORM (postgres.js driver, `prepare:false` for the pooler). Schema/client in `apps/web/src/db`.
- **Files**: Supabase Storage (bucket `geoscout`). Server-side upload via service-role key — `apps/web/src/lib/storage.ts` + `supabase.ts`. Attachments POST to `/api/attachments` as multipart; bytes pass through the server.
- **Auth**: MULTI-user, CUSTOM (not Supabase Auth). `users` table (admin/member roles); email+password → httpOnly JWT cookie carrying `{userId,email,name,role}`. `apps/web/src/middleware.ts` guards routes. Shared dataset, attributed per user.
  - Extension ingest auth is per-user: each user has a personal `api_key` (`gsk_…`); `authenticateApiKey()` in `lib/api.ts` maps the `x-api-key` header → the user, so scans/leads get a `created_by`.
  - Admins add teammates from the in-app `/team` page (`POST /api/users`). First admin seeded via `yarn workspace @geoscout/web user:add <email> <name> <password> admin`.
  - Attribution: `businesses.created_by` (first adder, never overwritten by scans), `businesses.assigned_to` (claimable), `scan_jobs.user_id` (who ran it), `lead_comments` (per-lead thread, each comment has an author).
- **UI**: Tailwind + shadcn/ui + SCSS. Professional dark theme (not pure black) with gold accent. Skeletons, not spinners.
- **Hosting**: Vercel (`gioscout.omprakashbharti.in`).

## Routing

- `/` — public marketing **landing page** (`app/page.tsx`, "field intelligence dossier" aesthetic;
  scoped fonts Fraunces/Hanken Grotesk/JetBrains Mono via next/font + `src/styles/landing.scss`).
- `/login` — auth (redirects to `/dashboard` when already signed in).
- `/dashboard/*` — the authed app (`app/dashboard/`: leads, scans, archive, team, settings).
- `middleware.ts` matcher protects `/dashboard/*` + data APIs only; `/` is public.

## Key files

- `packages/shared/src/*` — `status.ts`, `business.ts`, `filters.ts`, `scan-job.ts`, `opportunity.ts`, `user.ts`
- `apps/web/src/db/schema.ts` — all tables
- `apps/web/src/app/api/ingest/route.ts` — the dedup/upsert engine (extension → DB)
- `apps/web/src/lib/auth.ts` — JWT sign/verify + password check
- `apps/extension/src/content/` — scraper (DOM selectors centralized in `selectors.ts`)

## Database tables

`users` (admin/member, personal api_key) · `businesses` (canonical, `place_id` UNIQUE,
+ `created_by`/`assigned_to`) · `business_scan_history` (review/rating snapshots) ·
`lead_comments` (per-lead thread) · `scan_jobs` (one row per run, + `user_id`) ·
`filter_templates` (saved rule-sets) · `attachments` (Supabase Storage pointers).
See `apps/web/src/db/schema.ts`. NOTE: our table is `public.users` — distinct from
Supabase's built-in `auth.users` (different schema, no collision).

## Commands

```bash
yarn install              # from repo root
yarn dev                  # run web app (localhost:3000)
yarn db:generate          # generate a migration from schema changes
yarn db:migrate           # apply migrations to Neon
yarn db:studio            # drizzle studio
yarn ext:build            # build the extension into apps/extension/dist
yarn build                # production build of the web app
```

Extension: after `yarn ext:build`, load `apps/extension/dist` unpacked in
chrome://extensions (Developer mode). Set the API base URL + INGEST_API_KEY in the
extension Options page.

## Env vars

See `.env.example`. Web app reads them from `apps/web/.env.local`.
`DATABASE_URL` (Supabase Postgres URI), `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (storage),
`SUPABASE_STORAGE_BUCKET`, `JWT_SECRET`, `AUTH_EMAIL`, `AUTH_PASSWORD_HASH`,
`INGEST_API_KEY`, `NEXT_PUBLIC_APP_URL`.

## Conventions

- Shared types/validation → `packages/shared`. Import from `@geoscout/shared`.
- API routes validate input with the shared zod schemas before touching the DB.
- The scraper's DOM selectors are isolated in one file so Google UI churn is a one-file fix.
- Loading states use shadcn `Skeleton` components matching the final layout.

## Status / roadmap

- v1 (current, BUILT): single-query auto-run scanner; full dashboard (rule-builder,
  templates, detail drawer w/ growth sparkline, scan jobs, archive); R2 attachments.
  `yarn build` (web), `yarn ext:build`, and `yarn lint` all pass. Initial migration:
  `apps/web/drizzle/0000_smart_swarm.sql`.
- v2 (planned): multi-area/category job queue built on top of the single-query engine.

## Verified build commands

```bash
yarn install                                  # ✓ installs all workspaces
yarn workspace @geoscout/extension build      # ✓ → apps/extension/dist
yarn db:generate                              # ✓ → apps/web/drizzle/*.sql
yarn build                                    # ✓ Next.js production build (needs env vars set)
yarn lint                                     # ✓ no warnings/errors
```

## Gotchas learned

- `packages/shared` internal imports are EXTENSIONLESS (`./status`, not `./status.js`)
  — Next's webpack can't map `.js` → `.ts`. tsc(bundler) + esbuild + webpack all agree on extensionless.
- Any client component reading the DB `Business` type must `import type { Business } from '@/db/schema'`
  (type-only) so drizzle/pg-core isn't pulled into the browser bundle.
- `/login` uses `useSearchParams()` → must stay wrapped in `<Suspense>`.
