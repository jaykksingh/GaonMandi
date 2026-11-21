# GaonMandi

A Hindi-first, hyperlocal marketplace for small Indian farmers and fishers.

A farmer with 30 kg of vegetables or a fisher with 5 kg of fresh catch lists it in about 20 seconds with a live photo. Every registered buyer within 5–20 km gets an alert within a minute, and can send a per-kg bid or call the seller directly. More buyers competing means a fairer price before the stock spoils.

**Free for sellers, always. GaonMandi never handles money:** buyers and sellers settle in cash or UPI themselves.

## What it does

- **20-second listing:** pick a category icon, take a live photo (camera only, no gallery), choose the weight, and optionally add an expected rate and a short voice note.
- **Radius alerts:** verified buyers whose 5–20 km radius covers the seller's village get a push alert (and a WhatsApp message if they opted in), with a freshness timer.
- **Bids and one-tap calls:** buyers bid per kg or call; the seller accepts one bid and arranges pickup.
- **Trust without paperwork:** each listing shows the seller's name, village and (optionally) face photo. Buyers are verified by field agents. Reports and blocks keep it safe.
- **Works on a weak network:** small photos and an outbox that sends listings when the signal returns.
- **Admin console:** buyer verification, moderation, village setup, weekly reference prices and the pilot dashboard.

## Status

**Starter scaffolding.** The monorepo tooling and native development setup are in place; product features are built package by package. The first goal is a 60-day pilot in one cluster of 15–20 villages, measuring:

| Metric | Target |
|---|---|
| Median time to first bid | under 20 minutes |
| Price over the usual local vendor | +10% to +25% |
| Sellers who list again within 7 days | 40% or more |

## Planned stack

| Area | Choice |
|---|---|
| Language | TypeScript everywhere (strict, ESM, Node 22) |
| Monorepo | pnpm workspaces + Turborepo |
| Mobile | React Native CLI (bare, no Expo), Android first |
| Admin | Next.js (App Router) |
| API | Fastify, Zod contracts, generated OpenAPI client |
| Jobs | pg-boss worker with cron |
| Database | PostgreSQL 16 + PostGIS, Drizzle, SQL migrations, row-level security on private tables |
| Storage | Supabase Storage (S3 API); MinIO locally |
| Auth | Phone number + one-time code (SMS, DLT-registered) |
| Notifications | Firebase Cloud Messaging; WhatsApp Business Cloud API for opted-in buyers |
| Testing | Vitest, native Postgres + PostGIS, fast-check, React Native Testing Library, Maestro, Playwright |

## Runs without Docker or GPU

Prerequisites: Node 22.13+, pnpm via Corepack, JDK 17, Android SDK command-line tools, native Postgres 16 + PostGIS 3, and the MinIO binary. Install MinIO Client (`mc`) to provision the local media bucket. Copy `.env.example` to `.env` and set unique `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` values before running `pnpm local:minio`; the service binds to localhost only. The Android emulator is optional; use a USB-connected device over ADB when CPU virtualization is unavailable. Run the workspace tool check with `pnpm run doctor` (`pnpm doctor` is reserved by pnpm itself).

## Repository layout (target)

```
apps/mobile            React Native app for sellers and buyers
apps/admin             Staff console (Next.js)
apps/api               Fastify HTTP API
apps/worker            Background jobs: media, alerts, expiry, metrics
packages/rules         Pure product rules: alert matching, freshness, bids, metrics
packages/geo           Distance and radius helpers
packages/db            Schema, migrations, RLS policies, seed data
packages/contracts     Zod schemas, OpenAPI and the typed client
packages/format        ₹ and paise, kg and quintal, IST dates, Hindi relative times
packages/i18n          Hindi and English strings
packages/notify        Push, WhatsApp and SMS adapters
packages/media         Photo and voice processing
packages/ui-tokens     Design tokens for mobile and admin
packages/observability Logging with redaction of phone numbers and names
design/                Design tokens and the golden pilot fixture
docs/                  PRD, design spec, backend plan, architecture and decisions
```

## Documentation

| Document | Covers |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Problem, users, requirements, metrics, pilot plan, risks, open questions |
| [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md) | Screens, components, tokens, Hindi copy rules, accessibility |
| [`docs/BACKEND_PLAN.md`](docs/BACKEND_PLAN.md) | Schema, API, jobs, alerts, media, security, privacy, delivery plan |
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | System context, containers, flows, module boundaries |
| [`docs/architecture/DECISIONS.md`](docs/architecture/DECISIONS.md) | Architecture decision records |
| [`design/tokens.json`](design/tokens.json) | Colours, type, spacing, radius, motion |
| [`design/fixtures/pilot-cluster.json`](design/fixtures/pilot-cluster.json) | Golden sample cluster with the expected alerts, timers and metrics |

All people, phone numbers and places in the fixture are fictional.

## Privacy and safety

- Buyers see a seller's village and distance rounded to the nearest km, never an exact location.
- A seller's phone number is released only when a verified buyer taps Call, and sellers can switch calls off.
- Photo location data is removed before storage; photos and voice notes are deleted 30 days after a listing ends.
- Logs redact phone numbers, names and coordinates.

## License

Released under the [MIT License](LICENSE).
