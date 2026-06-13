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

- **DB**: Neon Postgres + Drizzle ORM (serverless HTTP driver). Schema/client in `apps/web/src/db`.
- **Files**: Cloudflare R2 (S3-compatible) for lead attachments. Helper in `apps/web/src/lib/r2.ts`.
- **Auth**: single user. email+password → httpOnly JWT cookie; `apps/web/src/middleware.ts` guards routes.
- **UI**: Tailwind + shadcn/ui + SCSS. Professional dark theme (not pure black) with gold accent. Skeletons, not spinners.
- **Hosting**: Vercel (`gioscout.omprakashbharti.in`).

## Key files

- `packages/shared/src/*` — `status.ts`, `business.ts`, `filters.ts`, `scan-job.ts`, `opportunity.ts`
- `apps/web/src/db/schema.ts` — all tables
- `apps/web/src/app/api/ingest/route.ts` — the dedup/upsert engine (extension → DB)
- `apps/web/src/lib/auth.ts` — JWT sign/verify + password check
- `apps/extension/src/content/` — scraper (DOM selectors centralized in `selectors.ts`)

## Database tables

`businesses` (canonical, `place_id` UNIQUE) · `business_scan_history` (review/rating
snapshots) · `scan_jobs` (one row per run) · `filter_templates` (saved rule-sets) ·
`attachments` (R2 pointers). See `apps/web/src/db/schema.ts`.

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
`DATABASE_URL`, `JWT_SECRET`, `AUTH_EMAIL`, `AUTH_PASSWORD_HASH`, `INGEST_API_KEY`,
`R2_*`, `NEXT_PUBLIC_APP_URL`.

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
