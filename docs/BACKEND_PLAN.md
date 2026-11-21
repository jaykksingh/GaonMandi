# GaonMandi backend plan v1.0

How the API, worker and database implement the [PRD](PRD.md). Architecture overview: [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md). Decisions: [`architecture/DECISIONS.md`](architecture/DECISIONS.md).

## 1. Requirements map
| PRD requirement | Module / package | Section |
|---|---|---|
| FR-01 Phone sign-up | `auth`, `notify` (SMS) | §6 |
| FR-02/03 Profiles, verification | `profiles`, `admin` | §5, §8 |
| FR-04/05 Listing, media, outbox | `listings`, `media`, `packages/media` | §7.1, §7.2 |
| FR-06/11 My listings, expiry | `listings`, worker `listings.expire` | §7.4 |
| FR-07, §7.3 Alerts, feed | `alerts`, `packages/rules`, `packages/geo`, `notify` | §7.3 |
| FR-08 Bids | `bids`, `packages/rules` | §7.5 |
| FR-09 Calling | `contact` | §7.6 |
| FR-10 Deals | `deals` | §7.5 |
| FR-12 Reports, blocks | `safety` | §7.7 |
| FR-13 Notification settings | `profiles`, `notify` | §7.3 |
| FR-14/16 Admin, reference prices | `admin` | §8 |
| §5 Metrics | `metrics`, `packages/rules` | §12 |

## 2. Principles
1. **Never handle money** (ADR-007). No payment code, tables or providers in the MVP.
2. **Integers for amounts:** paise and grams (ADR-008).
3. **Rules are pure** and live in `packages/rules` (ADR-009). Services call them; they never re-implement them.
4. **Privacy first:** exact coordinates and phone numbers never leave the API except a phone number on a verified call tap (§7.6).
5. **Weak networks:** small payloads, idempotent writes, retries are safe.

## 3. Stack
| Concern | Choice |
|---|---|
| Runtime | Node 22, TypeScript strict, ESM |
| HTTP | Fastify 5, `fastify-type-provider-zod`, `@fastify/rate-limit`, OpenAPI via `@fastify/swagger` |
| Validation | Zod 4 at every boundary (HTTP, jobs, webhooks) |
| Database | Postgres 16 + PostGIS 3, Drizzle for typed queries, plain SQL migrations |
| Jobs | pg-boss with cron |
| Storage | S3 API (Supabase Storage in the cloud, MinIO locally), signed upload URLs |
| Images | `sharp` (resize, EXIF strip) in the worker |
| Push | Firebase Admin SDK (FCM HTTP v1) |
| WhatsApp | WhatsApp Business Cloud API (Graph API) template messages |
| SMS | MSG91 OTP API (DLT), behind an adapter |
| Auth tokens | `jose` (signed JWT access tokens, 15 min), opaque rotating refresh tokens (30 days) |
| Logging | pino with a redaction list (phone, name, coordinates, tokens) |
| Tests | Vitest, native Postgres 16 + PostGIS (throwaway database per run), fast-check |

## 4. Modules (apps/api/src/modules)
`auth` · `profiles` · `villages` · `media` · `listings` · `alerts` · `bids` · `deals` · `contact` · `safety` · `notifications` · `admin` · `metrics`. Each module: `routes.ts` (thin), `service.ts` (logic), `repo.ts` (SQL), `schemas.ts`, `jobs.ts`, tests beside them.

## 5. Data model

### 5.1 Tables (Postgres)
```sql
create extension if not exists postgis;

create table clusters (
  id uuid primary key default gen_random_uuid(),
  name text not null,                         -- e.g. "Pilot cluster 1"
  state_code text not null,                   -- ISO 3166-2:IN, e.g. 'IN-BR'
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);

create table villages (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references clusters(id),
  name_hi text not null,
  name_en text not null,
  kind text not null check (kind in ('village','town')),
  point geography(Point, 4326) not null,
  active boolean not null default true
);
create index villages_point_gix on villages using gist (point);

create table users (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null unique,            -- never logged, never returned except §7.6
  phone_hash bytea not null unique,           -- HMAC-SHA256 for lookups in logs and metrics
  name text not null,
  locale text not null default 'hi' check (locale in ('hi','en')),
  roles text[] not null check (roles <@ array['seller','buyer']::text[] and cardinality(roles) > 0),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  consent_version text not null,
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table seller_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  village_id uuid not null references villages(id),
  tola text,
  face_photo_key text,                        -- null = show the village badge
  calls_allowed boolean not null default true
);

create table buyer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  business_type text not null check (business_type in ('retailer','pheriwala','food_business','caterer','other')),
  business_name text,
  market_village_id uuid not null references villages(id),  -- the buyer's market or town point
  radius_m integer not null check (radius_m in (5000,10000,15000,20000)),
  categories text[] not null,
  verified_at timestamptz,
  verified_by uuid references users(id),
  whatsapp_opt_in_at timestamptz,
  quiet_start time not null default '21:00',
  quiet_end time not null default '04:00'
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references users(id),
  village_id uuid not null references villages(id),
  village_point geography(Point, 4326) not null,  -- copied at publish; alerts use this
  category text not null,
  weight_g integer not null check (weight_g between 1000 and 20000000),  -- 1 kg to 200 quintal
  expected_rate_paise_per_kg integer check (expected_rate_paise_per_kg > 0),
  usual_rate_paise_per_kg integer check (usual_rate_paise_per_kg > 0),  -- FR-16, seller's own
  freshness_minutes integer not null,
  status text not null check (status in ('pending_media','live','deal_agreed','sold_elsewhere','expired','cancelled','removed')),
  published_at timestamptz,
  expires_at timestamptz,
  extended boolean not null default false,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (seller_id, idempotency_key)
);
create index listings_live_point_gix on listings using gist (village_point) where status = 'live';

create table listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  owner_id uuid not null references users(id),
  kind text not null check (kind in ('photo','voice')),
  object_key text not null,
  captured_at timestamptz not null,           -- from the app; checked against upload time
  duration_ms integer,                        -- voice only, <= 30000
  bytes integer not null,
  status text not null check (status in ('uploaded','processed','rejected','deleted'))
);

create table bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references users(id),
  rate_paise_per_kg integer not null check (rate_paise_per_kg > 0),
  quantity_g integer check (quantity_g > 0),  -- null = whole lot
  status text not null check (status in ('active','withdrawn','accepted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index bids_one_active on bids (listing_id, buyer_id) where status = 'active';

create table deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references listings(id),
  bid_id uuid not null unique references bids(id),
  seller_id uuid not null references users(id),
  buyer_id uuid not null references users(id),
  agreed_rate_paise_per_kg integer not null,
  final_rate_paise_per_kg integer,
  status text not null check (status in ('agreed','picked_up','no_show','cancelled')),
  agreed_at timestamptz not null default now(),
  picked_up_at timestamptz
);

create table deal_feedback (
  deal_id uuid not null references deals(id),
  from_user_id uuid not null references users(id),
  thumbs_up boolean not null,
  created_at timestamptz not null default now(),
  primary key (deal_id, from_user_id)
);

create table contact_events (
  id bigserial primary key,
  listing_id uuid not null references listings(id),
  from_user_id uuid not null references users(id),
  to_user_id uuid not null references users(id),
  kind text not null check (kind in ('call_tap')),
  created_at timestamptz not null default now()
);

create table alert_deliveries (
  id bigserial primary key,
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references users(id),
  channel text not null check (channel in ('push','whatsapp','feed_only')),
  status text not null check (status in ('queued','sent','failed','skipped_quiet','skipped_cap')),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id, channel)
);

create table blocks (blocker_id uuid references users(id), blocked_id uuid references users(id), created_at timestamptz default now(), primary key (blocker_id, blocked_id));

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id),
  target_user_id uuid references users(id),
  target_listing_id uuid references listings(id),
  reason text not null check (reason in ('fake_photo','wrong_weight','not_available','no_show','abusive','spam','other')),
  note text,
  status text not null default 'open' check (status in ('open','upheld','dismissed')),
  reviewed_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table reference_rates (
  cluster_id uuid not null references clusters(id),
  category text not null,
  week_start date not null,                   -- Monday, IST
  rate_paise_per_kg integer not null check (rate_paise_per_kg > 0),
  entered_by uuid not null references users(id),
  primary key (cluster_id, category, week_start)
);

-- Also: otp_challenges, sessions (refresh tokens, hashed), devices (FCM tokens), staff_users,
-- audit_log, app_events (metrics), notification_settings history. See WP-03/WP-06.
```

### 5.2 Categories
`fish`, `prawn`, `crab`, `leafy_greens`, `tomato`, `potato`, `onion`, `brinjal`, `okra`, `cauliflower_cabbage`, `gourd`, `chilli`, `vegetable_other`, `grain`, `fruit`. Each has a freshness group (PRD §7.1) defined in `packages/rules/src/categories.ts`.

### 5.3 Database roles and row-level security
- Roles: `gm_api`, `gm_worker`, `gm_admin` (status views only), `gm_migrator`. The API connects as `gm_api`.
- Every request runs inside `withUserTx(ctx, fn)`, which sets `app.user_id` and `app.roles`.
- RLS is **enabled and forced** on private tables: `bids` (seller of the listing or the bidder), `deals` and `deal_feedback` (the two parties), `contact_events`, `devices`, `sessions`, `blocks`, `reports` (reporter or staff), `buyer_profiles` and `seller_profiles` (owner; the public fields come through views).
- Public listing data is read through the view `v_live_listings_public`, which leaves out `seller_id`, exact points and keys.
- Every RLS table has a cross-user test in `pnpm test:rls`.

## 6. Authentication
- `POST /v1/auth/otp` `{ phone }` → sends a 6-digit code (DLT template) and returns `challengeId`. Limits: 1 per 30 s per number, 5 per hour per number, 20 per hour per IP.
- `POST /v1/auth/verify` `{ challengeId, code }` → `{ accessToken, refreshToken, user | needsProfile }`. The code is stored as an HMAC, expires in 5 minutes, and allows 5 attempts.
- `POST /v1/auth/refresh` rotates the refresh token; reuse of an old token revokes the whole family.
- `POST /v1/auth/logout` revokes the session and the device's FCM token.
- Tokens on the phone live in the Android Keystore (`react-native-keychain`), never in AsyncStorage.
- Staff (admin console) sign in with email, password and TOTP; staff sessions last 12 hours.

## 7. Core behaviour

### 7.1 Media upload
1. `POST /v1/media/uploads` `{ kind, contentType, bytes, capturedAt }` → checks limits (photo ≤ 1.5 MB as sent, voice ≤ 30 s and ≤ 600 KB, JPEG/WebP or AAC/Opus) and `capturedAt` within 15 minutes of now (ADR-012) → returns a signed PUT URL (5 minutes) and `mediaId`.
2. The worker job `media.process` checks the real file type, strips EXIF, creates 1280 px and 320 px WebP versions, and marks the media `processed` or `rejected`.

### 7.2 Create and publish a listing
- `POST /v1/listings` with an `Idempotency-Key` header: category, `weightG`, optional rates, `freshnessMinutes` (within the category's limits), `mediaIds` (1–3 photos, 0–1 voice).
- The listing starts as `pending_media`. When all media are processed, the worker sets `live`, `published_at = now()`, `expires_at = published_at + freshness` and enqueues `alerts.fanout`.
- If media are rejected, the listing stays `pending_media` and the seller gets a push to retake the photo.

### 7.3 Alert fan-out
`alerts.fanout(listingId)` (singleton key = listing id):
1. Candidate query:
```sql
select b.user_id, b.radius_m, ST_Distance(v.point, l.village_point) as distance_m
from buyer_profiles b
join villages v on v.id = b.market_village_id
join users u on u.id = b.user_id and u.status = 'active'
join listings l on l.id = $1
where b.verified_at is not null
  and l.category = any (b.categories)
  and ST_DWithin(v.point, l.village_point, b.radius_m)
  and not exists (select 1 from blocks k where (k.blocker_id = l.seller_id and k.blocked_id = b.user_id)
                                          or (k.blocker_id = b.user_id and k.blocked_id = l.seller_id));
```
2. `packages/rules` `decideAlert(buyer, listing, now, sentToday)` applies quiet hours and the daily cap (PRD §7.3) and returns `push`, `push+whatsapp`, `skipped_quiet` or `skipped_cap`.
3. Push messages are sent in batches of 500 through FCM; WhatsApp only for opted-in buyers. Each result is stored in `alert_deliveries` (unique per channel, so a re-run never sends twice).
4. Buyers whose alert was skipped still see the listing in their feed.

### 7.4 Feed and expiry
- `GET /v1/feed?category=&cursor=` returns live listings within the buyer's radius, newest first, with `distanceKm` rounded to the nearest whole km (minimum 1), `expiresAt`, `highestBidPaisePerKg` and photo URLs (signed, 1 hour).
- Cron `listings.expire` (every minute): `live` listings past `expires_at` → `expired`; active bids → `closed`; push to the seller.
- `POST /v1/listings/:id/extend` once per listing, up to the category default.

### 7.5 Bids and deals
- `POST /v1/listings/:id/bids` `{ ratePaisePerKg, quantityG? }` creates or raises the buyer's active bid (`packages/rules` `validateBid`: verified buyer, listing `live`, not the seller, not blocked, quantity ≤ weight, rate between ₹1 and ₹5,000 per kg).
- `DELETE /v1/bids/:id` withdraws.
- `POST /v1/bids/:id/accept` (seller only, `If-Match` listing version): in one transaction, bid → `accepted`, other active bids → `closed`, listing → `deal_agreed`, a `deals` row is inserted. Returns 409 if the listing changed.
- `POST /v1/deals/:id/picked-up` `{ finalRatePaisePerKg? }`, `POST /v1/deals/:id/no-show` (seller or buyer), `POST /v1/deals/:id/feedback` `{ thumbsUp }`.

### 7.6 Calling
`POST /v1/listings/:id/contact` (buyer → seller) or `POST /v1/bids/:id/contact` (seller → bidder):
- Checks: caller verified (buyer side), seller `calls_allowed` (buyer side), not blocked, listing not `removed`, at most 20 call taps per hour per user.
- Logs a `contact_events` row and returns `{ phone }` for the dialer. The phone number is never included in any other response.

### 7.7 Safety
- `POST /v1/reports`, `POST /v1/blocks`, `DELETE /v1/blocks/:userId`.
- Three upheld reports in 30 days → status `suspended` (job `safety.evaluate`), live listings → `removed`.
- Suspended users can sign in and see a Hindi notice with the grievance contact, but can't list, bid or call.

### 7.8 Errors and conventions
- Errors use RFC 9457 `application/problem+json` with a `code`: `validation_failed`, `not_found`, `forbidden`, `not_verified`, `listing_not_live`, `conflict`, `rate_limited`, `media_too_old`, `calls_off`, `suspended`.
- Every create endpoint accepts `Idempotency-Key`. Updates to listings and deals use `If-Match` with a version.
- Responses are small: no unused fields, photo URLs only at the needed size.

## 8. Admin API (`/v1/admin`, staff role + TOTP)
- Buyers: list unverified, verify (with a note), unverify.
- Reports: queue, uphold or dismiss, suspend or restore a user, remove a listing.
- Clusters and villages: create and edit (name in Hindi and English, point, kind).
- Reference rates: enter the weekly rate per category.
- Metrics: the pilot dashboard numbers from aggregate views. No admin response contains a phone number.
- Every admin action is written to `audit_log` (who, what, when, before and after).

## 9. Jobs (pg-boss)
| Job | Trigger | Singleton key | Notes |
|---|---|---|---|
| `media.process` | Upload complete | media id | Strip EXIF, resize, then maybe publish |
| `alerts.fanout` | Listing live | listing id | §7.3 |
| `listings.expire` | Cron, every minute | — | Idempotent |
| `listings.expiring_soon` | Cron, every 5 min | listing id | Push to seller 30 min before expiry |
| `bids.notify` | Bid created or raised | bid id + version | Push to seller |
| `deals.notify_closed` | Deal agreed | listing id | Push to other bidders |
| `safety.evaluate` | Report upheld | user id | Suspension rule |
| `metrics.rollup` | Cron, hourly | hour | Fills metric tables (§12) |
| `retention.purge` | Cron, nightly | — | §10.3 |

## 10. Security and privacy

### 10.1 Threats and controls
| Threat | Control |
|---|---|
| OTP abuse (SMS pumping) | Per-number, per-IP and per-day limits; India numbers only; captcha after repeated failures |
| Scraping seller numbers | Numbers only through §7.6 with verification, rate limits and logging |
| Fake listings | Camera-only, capture-time check, reports, suspension |
| Location exposure | Village points only; EXIF stripped; rounded distances |
| Account takeover | Short access tokens, rotating refresh with reuse detection, logout revokes device |
| Data leak between users | Forced RLS on private tables with tests; public data through views only |
| Staff misuse | Staff role + TOTP, audit log, no phone numbers in admin responses |

### 10.2 Logging and analytics
pino redacts `phone`, `phone_e164`, `name`, `point`, coordinates, tokens and codes. Metrics events carry user ids and phone hashes, never names, numbers or photos.

### 10.3 Retention
| Data | Kept for |
|---|---|
| Photos and voice notes | 30 days after the listing ends (longer only while a report is open) |
| Listings, bids, deals | 13 months, then anonymised for metrics |
| Contact events, alert deliveries | 90 days |
| OTP challenges | 24 hours |
| Audit log | 2 years |
| Deleted account | Profile, photos and voice removed within 7 days; deal rows anonymised |

## 11. Notifications
- **Push (FCM):** new listing nearby (buyer), new or raised bid, deal agreed, listing expiring, listing expired. Text in the user's language from `packages/i18n`.
- **WhatsApp:** one utility template for "new listing nearby" with category, weight, village, distance and a deep link. Needs Meta approval.
- **SMS:** OTP only.
- Device tokens are refreshed on every app start; invalid tokens are removed after an FCM error.

## 12. Metrics
Computed by `packages/rules` from `listings`, `bids`, `contact_events`, `deals` and `reference_rates`, rolled up hourly:
- **Time to first bid:** `min(first bid created_at, first contact event created_at) − published_at`, per listing; median per day over listings that got a response. Listings with no response are left out of the median and reported separately (they lower liquidity).
- **Price realization:** `(final_rate or agreed_rate − reference_rate) / reference_rate` per completed deal, using the ops reference rate for the listing's category and week, else the seller's `usual_rate`; median per week. Deals with no reference are left out and counted.
- **7-day repeat sellers:** sellers with a listing in a week who publish again within 7 days of that listing.
- Also: listing time (from app events), liquidity, deal rate, active buyers, alert latency, no-show rate.
Golden examples are in `design/fixtures/pilot-cluster.json` (`expected.metrics`).

## 13. Testing strategy
| Layer | What | Tools |
|---|---|---|
| Rules and geo | Golden fixture, property tests (distance symmetry, rounding, timer limits) | Vitest, fast-check |
| Database | Migrations on an empty DB; RLS cross-user tests for every private table; PostGIS radius queries against the fixture | native Postgres + PostGIS, throwaway DB per run |
| API | Route tests: auth, validation, rate limits, idempotency, `If-Match`, problem codes | Vitest + Fastify inject |
| Jobs | Run twice → same state; fan-out never sends twice | pg-boss in test mode |
| Notifications | Fake FCM, WhatsApp and SMS adapters record calls | `packages/notify/testing` |
| Mobile | Component tests; end-to-end flows on an optional emulator (KVM/HVF, no GPU) or a physical device over ADB; release gate is headless Jest + Gradle build | Jest + React Native Testing Library, Maestro |
| Admin | Component and e2e tests | Vitest, Playwright |

## 14. Pilot readiness review (before Day 1)
- [ ] All P0 requirements pass their acceptance checks on a 2 GB RAM Android phone over 3G.
- [ ] RLS tests pass for every private table; a security review found no high issues.
- [ ] DLT templates approved; WhatsApp template approved; FCM production keys in the secret store.
- [ ] Consent text and privacy notice in Hindi reviewed; grievance contact published.
- [ ] Legal check on local trade rules done (PRD §11).
- [ ] Admin console: verification, moderation, reference rates and dashboard work with real data.
- [ ] Backups and restore tested; alerts on API errors, job failures and SMS spend.

## 15. Delivery plan
Assumes one engineer, plus field staff for the pilot.

| Weeks | Engineering | Field and product |
|---|---|---|
| 1–2 | Monorepo, rules, database, contracts, tokens, i18n | Pick the pilot block; legal check; DLT and WhatsApp registration; draw the design canvas |
| 3–4 | Auth, profiles, media, listings, alerts, bids, calls, deals | Draft Hindi copy; recruit 2 field agents |
| 5–6 | Mobile seller and buyer flows, admin console, metrics | Buyer list for the block; demo script |
| 7 | Hardening, pilot readiness review | Train field agents on the dev build |
| 8–16 | On call for the 60-day pilot; fixes | Pilot phases 1–3 (PRD §9) |

## 16. Cost estimate for the pilot (to verify with providers)
| Item | Assumption | Rough monthly cost |
|---|---|---|
| Supabase | Pro plan, small database | about US$25 |
| API and worker hosting | One small instance each | US$10–25 |
| SMS OTP | 2,000 OTPs | a few hundred rupees (DLT rates vary by provider) |
| WhatsApp | Utility templates for opted-in buyers only | depends on Meta's India rates; cap daily volume |
| FCM | Push | free |
Exact prices change; confirm before the pilot budget is fixed.

## 17. Decisions needed
1. Pilot block and state (PRD Q-01).
2. Direct numbers or masked calling (PRD Q-02).
3. Sealed or visible highest bid (PRD Q-03).
4. API hosting provider in India (Supabase Mumbai is the default for data).
5. SMS provider (MSG91 default) and WhatsApp business account owner.
