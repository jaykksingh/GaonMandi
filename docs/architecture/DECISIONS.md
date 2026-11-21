# Architecture decision records

Each record states the context, the decision and its consequences. Status is **Accepted** unless marked otherwise. A new decision that changes an old one supersedes it; old records are never edited except to add "Superseded by".

## ADR-001 Modular monolith
**Context:** one small team, one pilot cluster, a few hundred users at first.
**Decision:** one API service and one worker, split into modules with strict boundaries (`apps/api/src/modules/<module>`), sharing packages. No microservices.
**Consequences:** simple deploys and local runs. Module boundaries are enforced by dependency rules (ARCHITECTURE §6), so a module can be split out later if needed.

## ADR-002 TypeScript everywhere
**Decision:** TypeScript (strict, ESM) for the mobile app, API, worker, admin console and shared packages, on Node 22. pnpm workspaces with Turborepo.
**Consequences:** one language, shared types and Zod schemas from the API to the phone. Native Android code only where a library needs it.

## ADR-003 PostgreSQL 16 with PostGIS, on Supabase, reached only through our API
**Context:** radius search ("buyers within 15 km of this village") is the core query.
**Decision:** Postgres 16 with PostGIS (`geography(Point, 4326)`, `ST_DWithin`). Hosted on Supabase (Mumbai region) for the database and file storage. The mobile app and admin console never call Supabase directly; only the API and worker do.
**Consequences:** radius queries use a GiST index. Local development runs Postgres with PostGIS in Docker and MinIO for storage. Row-level security protects private tables as a second line of defence (BACKEND_PLAN §5.3).

## ADR-004 pg-boss for jobs
**Decision:** background jobs (alert fan-out, expiry, media processing, reminders, metrics roll-ups) run on pg-boss in the same Postgres.
**Consequences:** no extra queue service. Jobs must be idempotent and use singleton keys.

## ADR-005 Mobile app on the React Native CLI, Android first
**Decision:** bare React Native CLI (no Expo), TypeScript. Android 8.0+ (API 26) for the pilot; iOS later. Target phones with 2 GB RAM. React Navigation, TanStack Query, FCM through `@react-native-firebase/messaging`, a camera library that supports capture-only mode.
**Consequences:** full control over the camera, background upload and APK size (target < 25 MB). Native builds and releases through Fastlane.

## ADR-006 Own phone + OTP sign-in
**Context:** users have phone numbers, not emails. SMS in India needs DLT-registered templates.
**Decision:** our own OTP tables and session tokens in the API, with SMS sent through a provider adapter (MSG91 first, with a fake for tests). Short-lived access token plus a rotating refresh token stored in the Android Keystore through `react-native-keychain`.
**Consequences:** no vendor lock-in for auth, and full control of rate limits. We own the security of the OTP flow (BACKEND_PLAN §6).

## ADR-007 GaonMandi never handles money
**Decision:** no payments, wallets, escrow or payouts. Deals are settled between buyer and seller in cash or UPI. The app records the agreed and final rates only for metrics.
**Consequences:** no payment licence, no refunds or disputes over money. Buyer Pro billing later goes through Google Play Billing or a payment gateway as a separate, isolated module.

## ADR-008 Money in paise, weight in grams, time in UTC
**Decision:** money and rates are integers in paise (rates are paise per kg). Weight is an integer in grams. Timestamps are UTC `timestamptz`; display is IST (Asia/Kolkata). All formatting goes through `packages/format`.
**Consequences:** no float rounding errors. A 2.5 kg crab lot is `2500` grams.

## ADR-009 Pure rules package and a golden fixture
**Decision:** every product rule (alert matching, freshness timers, bid validation, deal states, price realization, metrics) lives in `packages/rules` as pure functions with no I/O. They are tested against `design/fixtures/pilot-cluster.json`.
**Consequences:** the API, worker and admin dashboard share one implementation. Golden values change only with a PRD change.

## ADR-010 Location privacy: buyers see village and rounded distance
**Decision:** sellers pick a village (or GPS snaps to the nearest village point). Alerts and distances use the village point, not the seller's exact position. Buyers see the distance rounded to the nearest km. The exact pickup point is agreed on the call.
**Consequences:** a seller's home is never exposed by the app. Distance is accurate to about the size of a village, which is enough for a 5–20 km radius.

## ADR-011 Push first, WhatsApp for opted-in buyers, SMS only for OTP
**Decision:** FCM push is the main alert channel. WhatsApp Business Cloud API template messages go only to buyers who opted in. SMS is used only for OTP. All three sit behind adapters in `packages/notify`, with fakes for tests.
**Consequences:** lowest cost per alert. WhatsApp templates need Meta approval before the pilot.

## ADR-012 Camera-only live photos
**Decision:** the listing flow opens the in-app camera only. The app attaches a capture time; the server rejects photos older than 15 minutes at upload, strips EXIF metadata, and makes a 1280 px and a 320 px version.
**Consequences:** strong (not perfect) proof of freshness. A determined user could photograph old stock; reports and moderation cover that.

## ADR-013 Hindi-first internationalisation
**Decision:** every user-facing string lives in translation files (`packages/i18n`), Hindi as the default and English second. Devanagari text uses Noto Sans Devanagari. Digits are shown as Latin digits (1, 2, 3) in both languages (PRD open question Q-10).
**Consequences:** adding Bhojpuri or Maithili means adding a translation file, not changing screens.

## ADR-014 Separate admin console
**Decision:** a staff-only Next.js app (`apps/admin`) for verification, moderation, cluster setup, reference prices and the pilot dashboard. It calls `/v1/admin` routes, which require a staff role and a second factor.
**Consequences:** staff tools never ship inside the mobile app.

## ADR-015 Migrations
**Decision:** plain SQL migrations, timestamped (`packages/db/migrations/YYYYMMDDHHMM_<wp>_<slug>.sql`), expand-and-contract, never edited after merge.

## ADR-016 No AI in the MVP
**Context:** AI could transcribe voice notes, suggest categories from photos or detect old photos, but none of these is needed to prove liquidity.
**Decision:** no AI calls in the MVP. If AI is added after the pilot, it lives in one package with versioned prompts and evals, never sets a price, and never sees a phone number.
**Consequences:** lower cost and fewer privacy questions for the pilot.
