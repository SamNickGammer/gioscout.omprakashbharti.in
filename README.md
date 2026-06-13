<div align="center">
  <img src="./assets/logofull.png" alt="GeoScout" width="420" />

  <h3>Turn Google Maps into a continuously-refreshed lead-intelligence database.</h3>

  <p>
    A Chrome extension scrapes Google Maps search results and streams them to a
    Next.js dashboard, where a rule-builder turns raw businesses into highly
    targeted prospects for selling websites &amp; automation services.
  </p>

  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs" />
    <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle&logoColor=000" />
    <img alt="Neon" src="https://img.shields.io/badge/Neon-Postgres-00e599?logo=postgresql&logoColor=fff" />
    <img alt="License" src="https://img.shields.io/badge/license-MIT-gold" />
  </p>
</div>

---

## Why

Searching “restaurants in Patna” gives you hundreds of businesses — but for selling
websites you only care about the ones that are **already successful yet have no (or a
weak) web presence**. GeoScout collects every business once, stores it, and lets you
re-slice the data with filters at any time:

> Category: Restaurant · Reviews: 300+ · Rating: 4.3+ · Website: None · Phone: Required

…instantly surfaces the businesses most likely to convert.

## How it works

```
┌──────────────────┐     scrape + dedupe      ┌──────────────────┐     filter at query time
│  Chrome Extension │ ───────────────────────▶ │   Next.js  API   │ ──────────────────────────▶  Dashboard
│  (Google Maps)    │   POST /api/ingest       │   + Neon Postgres │                              (rule-builder)
└──────────────────┘                           └──────────────────┘
```

- **A business exists exactly once**, keyed by Google's stable Place ID. Re-scanning
  the same area updates the record and appends a **scan-history** snapshot (track
  review growth over time) — never a duplicate.
- **Nothing is ever deleted.** Leads flow through a lifecycle —
  `active → contacted → interested → quotation_sent → client / rejected` — and a soft
  **archive** keeps hidden records recoverable.
- **Filtering is decoupled from scraping.** All raw data is stored; change your filters
  any time without rescanning.

## Features

- 🧲 **Automated scraper** — auto-scrolls a Maps search, scrapes every result, dedupes by Place ID, streams to the API.
- 🛠️ **Rule-builder** — category, city, review min/max, rating, has/no website, contact & social presence, opportunity tier.
- 💾 **Saved templates** — run “High-Potential Restaurants” across Patna, Ranchi, Delhi without reconfiguring.
- 📈 **Scan history** — per-business review/rating growth sparkline.
- 🗂️ **Scan jobs** — every run logged with found / new / updated counts.
- 🗃️ **Soft-delete archive** — hide leads without losing them.
- 📎 **Attachments** — store screenshots/docs per lead (Cloudflare R2).
- 🌑 **Professional dark theme** with gold accent, skeleton-first loading.

## Tech stack

| Layer        | Choice |
|--------------|--------|
| Frontend/API | Next.js 15 (App Router), React, TypeScript |
| Styling      | Tailwind CSS + shadcn/ui + SCSS |
| Database     | Neon Postgres + Drizzle ORM |
| File storage | Cloudflare R2 (S3-compatible) |
| Auth         | Single-user email/password → JWT cookie |
| Extension    | Chrome Manifest V3 (content + background) |
| Monorepo     | Yarn workspaces (`apps/*`, `packages/*`) |

## Getting started

```bash
git clone <repo>
cd gioscout.omprakashbharti.in
yarn install

cp .env.example apps/web/.env.local   # fill in Neon, R2, auth, ingest key
yarn db:generate && yarn db:migrate   # create tables in Neon
yarn dev                              # http://localhost:3000
```

Build & load the extension:

```bash
yarn ext:build
# chrome://extensions → Developer mode → Load unpacked → apps/extension/dist
# open the extension Options, set API base URL + INGEST_API_KEY
```

## Environment

See [`.env.example`](./.env.example) for the full list (`DATABASE_URL`, `JWT_SECRET`,
`AUTH_EMAIL`, `AUTH_PASSWORD_HASH`, `INGEST_API_KEY`, `R2_*`, `NEXT_PUBLIC_APP_URL`).

## Project structure

```
apps/web          Next.js dashboard + API + Drizzle schema
apps/extension    Manifest V3 scraper (content + background + popup + options)
packages/shared   zod schemas + types shared by both sides
assets/           brand logos
```

## Deploy

- **Web** → Vercel. Add the env vars, point `gioscout.omprakashbharti.in` via CNAME.
- **DB** → Neon (free tier; scales to zero, data persists).
- **Files** → Cloudflare R2 bucket + public URL.

## License

MIT — see [`LICENSE`](./LICENSE).

> ⚠️ GeoScout DOM-scrapes Google Maps for personal lead research. Respect Google's
> Terms of Service and local laws; use responsibly and at your own risk.
