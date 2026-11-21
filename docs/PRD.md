# GaonMandi: Product Requirements Document (PRD) v1.0

**Status:** Draft for the MVP and the 60-day pilot · **Owner:** Product (Jay Singh) · **Last updated:** 2026-11-21

GaonMandi ("village market") is a Hindi-first, hyperlocal mobile marketplace. Small farmers and local fishers list a small harvest or a fresh catch, from 1 kg to a few quintals, with a live photo. Nearby buyers get an alert within minutes, then send a per-kg bid or call the seller directly.

| Document | What it holds |
|---|---|
| This PRD | Problem, users, goals, requirements, metrics, pilot plan, risks |
| [`DESIGN_SPEC.md`](DESIGN_SPEC.md) | Screens, components, tokens, Hindi copy rules, accessibility |
| [`BACKEND_PLAN.md`](BACKEND_PLAN.md) | Schema, API, jobs, alerts, media, security and privacy |
| [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | System context, containers, flows, module boundaries |
| [`architecture/DECISIONS.md`](architecture/DECISIONS.md) | Architecture decision records (ADRs) |
| [`../design/fixtures/pilot-cluster.json`](../design/fixtures/pilot-cluster.json) | Golden pilot cluster: the alert, expiry and metric values the code must produce |

**Precedence:** this PRD defines *what* and *why*. DESIGN_SPEC and BACKEND_PLAN define *how*. When they disagree, raise it as an open question (§13). Don't guess.

---

## 1. Summary

**For** small farmers with 10–200 kg of produce and fishers with 2–10 kg of fish, prawns or crab,
**who** can't reach a distant mandi and sell to one or two local vendors at whatever price those vendors set,
**GaonMandi is** a phone app that puts their harvest in front of every registered buyer within 5–20 km in under a minute,
**so that** several buyers compete for it and the seller gets a fairer price before the stock spoils.
**Unlike** e-NAM, DeHaat or Ninjacart (built for bulk, B2B lots) and WhatsApp groups (unstructured, no distance or freshness),
**GaonMandi** is built for micro-lots, local pickup, live photo proof and a freshness timer.

**Product promises (non-negotiable):**
1. **Free for sellers, always.** No listing fee, no commission.
2. **GaonMandi never handles money.** No payments, wallets or escrow. Buyer and seller settle in cash or UPI themselves.
3. **A listing takes about 20 seconds.** Icon, photo, weight, done. Typing is optional.
4. **Hindi first.** Every screen works in simple Hindi with icons, for first-time smartphone users.
5. **The photo is live.** It's captured in the app at listing time, never picked from the gallery.

---

## 2. Assessment of the pitch brief

The brief (Startup Concept & Pilot Pitch Brief, 2 pages) is strong on the problem and the go-to-market. This PRD keeps its core and fills the gaps below.

### 2.1 What is strong
- **A real, specific gap.** Micro-lots of 1–200 kg are below mandi and B2B minimums, and perishables force distress sales. The pain is daily and measurable.
- **Demand already exists.** Town retailers, pheriwalas, dhabas and caterers buy fresh stock every morning. The app redirects existing demand instead of creating it, which is the hardest part for most marketplaces.
- **Cluster-by-cluster launch.** Seeding 40–50 buyers before sellers arrive solves the marketplace cold start in the right order.
- **Measurable pilot.** Time-to-first-bid, price realization and 7-day repeat sellers are the right three numbers.
- **Low-friction trust.** Face, name and village use the social recognition that already exists in villages, instead of KYC paperwork.

### 2.2 Gaps this PRD fills
| Gap in the brief | How the PRD handles it |
|---|---|
| No baseline for "price realization" | Ops records reference vendor rates weekly, and sellers can enter their usual rate (FR-16, §7.2) |
| Seller phone number shown to every buyer | Calls only from verified buyers; sellers can switch calls off and use bids only (FR-09, §10) |
| Safety of women sellers | Face photo optional for women at sign-up, with a village badge instead; calls off by default for them if they choose (FR-02) |
| Exact seller location | Buyers see village and distance rounded to 1 km; exact pickup is agreed on the call (FR-07) |
| What happens after a bid | A clear deal state: bid → accepted → picked up → done, with the final price recorded (FR-10) |
| Fake or old photos | Camera-only capture, capture time checked on the server, photos expire with the listing (FR-04) |
| Buyers who don't show up | Post-deal thumbs up/down, no-show reports and field-agent follow-up (FR-12) |
| Low connectivity | Listings are queued on the phone and sent when the network returns; photos are compressed to about 200 KB (FR-05) |
| Rules and permissions | DPDP Act 2023 consent, WhatsApp opt-in, SMS DLT registration, and a legal check on local selling rules before the pilot (§11) |

### 2.3 Assumptions to validate in the pilot
1. Buyers will open an alert and respond within 20 minutes in the morning window.
2. Sellers trust a stranger's bid enough to call back and sell.
3. Competition among 3+ buyers lifts the price 10–25% over the usual vendor.
4. Sellers come back within 7 days (catch and harvest repeat often enough).
5. Buyers keep using the app instead of only calling sellers directly after the first deal. This matters for revenue, not for seller value.

---

## 3. Users and personas

| Persona | Who | Needs | Constraints |
|---|---|---|---|
| **Farmer seller** (Ramesh, 42) | Grows vegetables on 1–2 acres; sells 20–60 kg a few times a week | A fair price today, before the produce wilts | Basic Android, reads a little Hindi, patchy 3G/4G |
| **Fisher seller** (Sunita, 35) | Catches fish, prawns or crab in a pond or river; 2–10 kg a morning | Sell within 3–4 hours of the catch | Wet hands, outdoors, bright sun; may not want her number public |
| **Retail buyer** (Asif, 29) | Vegetable or fish shop in the nearest town | Steady fresh supply before 9 a.m. | Buys daily, wants low effort and reliable sellers |
| **Pheriwala buyer** (Mohan, 50) | Sells door to door from a cart or cycle | Small lots close to his route | Price sensitive, phone-first |
| **Food business buyer** (dhaba, restaurant, caterer) | Kitchen near the highway or town | Fish and vegetables in fixed quantities | Wants call and pickup, fewer chats |
| **Field agent** (GaonMandi staff) | Runs demos at haats and catch points, verifies buyers | Fast onboarding tools, a queue of buyers to verify | Works on a phone in the field |
| **Admin / moderator** | Runs the pilot | Moderation, village list, pilot metrics | Web console |

**Households as buyers** are mentioned in the brief. They are **out of the MVP** because small household orders add noise for sellers. Revisit after the pilot (Q-04).

---

## 4. Goals and non-goals

### 4.1 Goals (MVP and pilot)
- **G1:** Prove liquidity in one cluster: most listings get a bid fast.
- **G2:** Prove seller value: better prices and repeat use.
- **G3:** Prove buyer habit: buyers respond to alerts every morning.
- **G4:** Build the product so the next cluster launches with configuration only (villages, buyers, radius), not code.

### 4.2 Non-goals (MVP)
- Payments, wallets, escrow, credit, or any money movement.
- Delivery or logistics (pickup is arranged by the buyer and seller).
- Bulk mandi trade, auctions over 200 kg, or B2B contracts.
- Quality grading, price prediction or advice.
- iOS (Android only for the pilot), a web app for sellers, or national coverage.
- AI features (see ADR-016). Voice notes are recorded and played, not transcribed.

---

## 5. Success metrics

### 5.1 Pilot targets (from the brief)
| Metric | Definition | Target (Days 46–60) |
|---|---|---|
| **Time to first bid** | Median minutes from publish to the first bid or call tap, over listings that got one (listings with none count against liquidity, §5.2) | **< 20 min** |
| **Price realization** | (Accepted per-kg rate − reference vendor rate) ÷ reference rate, median over completed deals | **+10% to +25%** |
| **7-day repeat sellers** | Share of sellers with a listing in week *n* who list again within 7 days | **≥ 40%** |

### 5.2 Supporting and guardrail metrics
| Metric | Why | Pilot guardrail |
|---|---|---|
| Listing time | The 20-second promise | Median ≤ 30 s from "Sell" tap to publish |
| Liquidity | Listings with ≥ 1 bid or call within 60 min | ≥ 70% |
| Deal rate | Listings that reach "accepted" | ≥ 40% |
| Active buyers | Buyers who bid or call at least 3 days a week | ≥ 25 of the 40–50 seeded |
| Alert latency | Publish to push delivered | p95 < 60 s |
| No-show rate | Accepted deals reported as buyer no-show | < 5% |
| Harassment reports | Reports of abusive calls or messages | 0 unresolved after 24 h |

All metrics are computed from app events and the deal records. No metric needs a seller's phone number or name (§11).

---

## 6. Scope and requirements

Priorities: **P0** = needed for the pilot · **P1** = right after the pilot · **P2** = later.

### 6.1 Account and onboarding
**FR-01 Phone sign-up and login (P0).**
- Language choice first (हिंदी default, English).
- Phone number and a 6-digit one-time code by SMS. No password and no email.
- The code auto-fills on Android where possible. Resend after 30 s; 5 tries, then a 15-minute pause.
- Role: **Seller**, **Buyer** or **Both**.
- *Accepted when:* a new seller goes from install to the seller home screen in under 90 seconds on a 3G connection.

**FR-02 Seller profile (P0).**
- Name, village (picked from the cluster's list, or found by GPS), tola (optional), face photo.
- The face photo can be skipped. The listing then shows a village badge instead. Field agents explain this to women sellers.
- Consent screen in Hindi (what is shown to buyers, what is stored), recorded with a version and time.

**FR-03 Buyer profile and verification (P0).**
- Name, business type (retailer, pheriwala, dhaba/restaurant, caterer, other), market or town, alert radius (5, 10, 15 or 20 km), categories to follow.
- **Verification:** a field agent checks the buyer in person or by call and marks them verified in the admin console.
- Unverified buyers can browse but can't bid, call or see the seller's face photo.

### 6.2 Selling
**FR-04 20-second listing (P0).** Four steps, all with large icons:
1. **Category:** icon grid (fish, prawns, crab, leafy greens, tomato, potato, onion, brinjal, okra, cauliflower or cabbage, gourd, chilli, other vegetable, grain, fruit).
2. **Live photo:** 1–3 photos from the in-app camera only. No gallery. The capture time comes from the app and is checked on the server: a photo older than 15 minutes at upload is rejected.
3. **Weight and rate:** quick chips (5, 10, 20, 50 kg; 1 or 2 quintal) or a number pad; unit kg or quintal. Expected rate in ₹/kg is optional.
4. **Freshness and voice:** freshness timer pre-set by category (§7.1) and adjustable within limits; optional voice note up to 30 s. Then **Publish**.
- *Accepted when:* a trained seller publishes in a median of ≤ 30 s, and the listing reaches buyers' phones within 60 s (p95).

**FR-05 Works on a weak network (P0).**
- Photos are compressed on the phone to about 200 KB (longest side 1280 px).
- If the network drops, the listing waits in an outbox and sends automatically. The seller sees "भेजा जा रहा है" (sending).
- The freshness timer starts at publish on the server, not at capture.

**FR-06 My listings (P0).**
- Live listings with the time left, bid count and the highest bid.
- Actions: view bids, call a bidder, accept a bid, mark "sold elsewhere", extend once, or cancel.

### 6.3 Buying
**FR-07 Alerts and the nearby feed (P0).**
- When a listing is published, every verified buyer whose radius covers the seller's village and who follows that category gets a push alert, and a WhatsApp message if they opted in (§7.3).
- The feed shows live listings within the buyer's radius, newest first, with a category filter.
- Each card shows the photo, category, weight, expected rate (if any), village, distance rounded to the nearest km, and time left.
- Exact seller coordinates are never sent to buyers.

**FR-08 Bids (P0).**
- A bid is a per-kg rate in ₹ and, optionally, a quantity if the buyer doesn't want the whole lot.
- The buyer sees the current highest bid rate (amount only, no names) and can raise their own bid. One active bid per buyer per listing.
- Bids close when the listing expires, is accepted, sold elsewhere or cancelled.
- Bids are non-binding until the seller accepts.

**FR-09 One-tap calling (P0).**
- A verified buyer taps **Call**, and the phone dialer opens with the seller's number. The seller can call any bidder from the bid list.
- Sellers can switch calls off. Buyers then can only bid, and the seller calls back.
- Every call tap is logged as a contact event, for metrics and abuse handling.
- *P1:* masked numbers through a calling provider, so neither side sees the other's number (Q-02).

**FR-10 Deal and pickup (P0).**
- The seller accepts one bid. The listing becomes **Deal agreed** and the other bidders are told it's gone.
- Pickup is arranged on the call. Either side marks **Picked up**. The seller can enter the final ₹/kg received (one tap if it equals the bid).
- After pickup, each side gives a thumbs up or thumbs down, and can report a no-show.

**FR-11 Expiry (P0).**
- Listings expire automatically when the freshness timer ends. Open bids close, and the seller gets a "list again?" prompt.
- A seller can extend once, by up to the category's default time.

### 6.4 Trust, safety and support
**FR-12 Reports and blocks (P0).**
- Report a listing (fake photo, wrong weight, not available) or a person (no-show, abusive call, spam).
- Block a person: they no longer see your listings or bids, and can't call through the app.
- Three upheld reports suspend an account until a moderator reviews it.
- Rate limits: a seller can have at most 10 live listings; a buyer can place at most 60 bids a day.

**FR-13 Notification settings (P0).** Buyers set categories, radius, quiet hours (default 9 p.m.–4 a.m.) and WhatsApp on/off. Sellers get alerts for new bids, a bid raised and a listing about to expire.

**FR-14 Ops and admin console (P0, web).**
- Buyer verification queue, a moderation queue for reports, and account suspension.
- Cluster setup: villages with coordinates, the town market, category timers.
- Weekly reference vendor rates per category (FR-16).
- Pilot dashboard with the metrics in §5.

**FR-15 Language (P0).** Every string in Hindi and English, kept in translation files. Icons carry meaning wherever possible. *P1:* Bhojpuri and Maithili; *P2:* Bengali, Odia and Telugu for coastal fish clusters.

**FR-16 Reference prices (P0).** Ops enters the usual local vendor rate per category every week. Sellers may also enter "my usual vendor rate" when listing. Price realization (§5.1) uses the ops rate, and the seller's rate where no ops rate exists.

### 6.5 After the pilot (P1/P2)
- **Buyer Pro** (₹199–499/month): early alerts (free buyers get them a few minutes later), a wider radius, unlimited call unlocks. Only after liquidity is proven.
- **Harvest boosts:** paid extra visibility for large lots.
- Masked calling, more languages, voice-to-text listing (needs an AI decision), transport partners, iOS.

---

## 7. Product rules

### 7.1 Freshness timer defaults
| Category group | Default | Min–max |
|---|---|---|
| Fish, prawns | 4 h | 1–8 h |
| Crab | 6 h | 2–12 h |
| Leafy greens | 8 h | 2–12 h |
| Other vegetables, fruit | 24 h | 4–48 h |
| Grain | 72 h | 24–168 h |

### 7.2 Units, money and time
- Weight is stored in grams (integer). 1 quintal = 100 kg.
- Money is stored in paise (integer). Rates are paise per kg. Display uses ₹ with Indian digit grouping (₹1,25,000).
- Times are stored in UTC and shown in India time (IST, Asia/Kolkata), in 12-hour format with Hindi words ("सुबह 7:30").

### 7.3 Who gets an alert
A buyer gets an alert for a listing when **all** of these hold:
1. The buyer is verified and active, and not blocked by the seller (or blocking the seller).
2. The distance from the seller's village point to the buyer's market point is within the buyer's radius.
3. The buyer follows the listing's category.
4. It's not the buyer's quiet hours (the alert waits in the feed instead).
5. The buyer hasn't hit the alert cap (30 alerts a day; after that, a daily summary).

The golden fixture (`design/fixtures/pilot-cluster.json`) lists the expected recipients for each sample listing.

---

## 8. User journeys

1. **Sunita sells her morning catch.** At 6:40 a.m. she taps **बेचें** (Sell), picks the fish icon, takes two photos, chooses 5 kg, types ₹180/kg and publishes. Within a minute, four buyers whose radius covers her village get an alert. At 6:49 a fish trader in her village bids ₹195/kg, at 6:52 Asif from the town bids ₹200/kg, and at 6:58 a highway dhaba bids ₹190/kg. Sunita keeps calls off, so she calls Asif herself, accepts his bid and hands over the fish at the pond at 7:30. She confirms ₹200 and gives a thumbs up. (This is listing `l-1` in the golden fixture.)
2. **Asif fills his shop.** At 6:30 a.m. he opens the feed and sees 6 live listings within 15 km. He bids on two vegetable lots, calls one farmer and plans one pickup route.
3. **A listing that nobody wants.** Ramesh's 40 kg of brinjal gets no bid in 3 hours. The app suggests lowering the expected rate. The listing expires at 24 h, and he gets a "list again?" prompt.

---

## 9. Pilot plan (60 days, one cluster)

One cluster is 15–20 neighbouring villages plus the nearest town market, in one block. The working assumption is one block in Bihar (Hindi-speaking, with both pond fish and vegetables). Final choice: Q-01.

| Phase | Days | What happens | Exit check |
|---|---|---|---|
| **Build** | Before Day 1 | MVP (P0 requirements), admin console, cluster set up | Pilot readiness review passes (BACKEND_PLAN §14) |
| **1 · Buyer seeding** | 1–15 | Field agents onboard and verify 40–50 buyers (fish merchants, vegetable retailers, dhabas, caterers) | ≥ 40 verified buyers with alerts working |
| **2 · Seller activation** | 16–45 | Morning demos at catch points and weekly haats; agents help sellers post their first listing on the spot | ≥ 150 sellers with a first listing |
| **3 · Validation** | 46–60 | Measure §5; weekly reference rates continue | Go / no-go for the next cluster |

**Go to the next cluster if:** time to first bid < 20 min, price realization ≥ +10%, 7-day repeat sellers ≥ 40%, and no unresolved safety incident.

**Pilot team (assumed):** 2 field agents, 1 ops/admin person, 1 engineer on call.

---

## 10. Privacy and safety by design
- Buyers see a seller's name, village, face photo (if given) and distance, never exact coordinates or the phone number on screen. The dialer receives the number only on a verified buyer's call tap.
- Sellers can switch calls off at any time.
- Photos have location metadata (EXIF) removed before storage. Photos and voice notes are deleted 30 days after a listing ends, except where kept for an open report.
- Deleting an account removes the profile, photos and voice notes. Deal records keep only anonymous numbers for metrics.
- No ads. No selling or sharing of data.

---

## 11. Compliance (check before the pilot)
- **DPDP Act 2023:** a clear Hindi consent notice, purpose limits, deletion on request, and a named grievance contact.
- **SMS:** DLT registration of the sender ID and OTP template with the SMS provider (required in India).
- **WhatsApp:** opt-in before any message, approved utility templates, and Meta's commerce policy (fresh food is allowed; check alcohol and live animal rules for crab and fish).
- **Local trade rules:** confirm with a local adviser that direct sale of small lots outside the mandi needs no licence or market fee in the pilot state, and whether fish sellers need any registration.
- **App store:** Google Play data safety form, and in-app account deletion.

---

## 12. Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Too few buyers respond (cold start) | Sellers give up after one try | Seed buyers first; field agents nudge buyers in the first weeks; alert only verified, active buyers |
| Buyers and sellers trade directly after the first deal | Fewer app deals, less future revenue | Fine for sellers; keep buyers through alerts, new sellers and Pro features later |
| Fake listings or old photos | Trust breaks | Camera-only photos, capture-time check, reports, suspension after 3 upheld reports |
| Harassment of sellers by phone | Safety, especially for women | Calls only from verified buyers, calls-off switch, block, quick moderation; masked calling in P1 |
| Weak network at catch points | Listings fail to send | Outbox and auto-retry, small photos, tiny API payloads |
| Low literacy | Sellers can't finish a listing | Icons, quick chips, voice note, field-agent demos, a 4-step flow |
| SMS and WhatsApp costs grow | Cost per listing rises | Push first; WhatsApp only for opted-in buyers; daily caps |
| Seasonality (monsoon, festivals) | Volume swings | Pilot length covers several weekly haat cycles; compare week over week |
| Regulation (APMC, fish rules) | Pilot blocked | Legal check in §11 before Day 1 |

---

## 13. Open questions
| ID | Question | Default until decided |
|---|---|---|
| Q-01 | Which block and state for the pilot? | One block in Bihar |
| Q-02 | Direct numbers or masked calling from day one? | Direct numbers for verified buyers; masked in P1 |
| Q-03 | Can buyers see the highest bid, or are bids sealed? | Highest rate visible, no names |
| Q-04 | Households as buyers in the pilot? | No |
| Q-05 | Should sellers see the reference vendor rate when listing? | No in the pilot (it would bias the metric) |
| Q-06 | WhatsApp in the pilot, or push only? | Push plus WhatsApp for opted-in buyers |
| Q-07 | Partial lots: can a seller accept two bids for parts of one lot? | No in the pilot; one accepted bid per listing |
| Q-08 | Hosting region and provider | Supabase in the Mumbai region (ap-south-1); API host to decide |
| Q-09 | Product name and Play Store listing | "GaonMandi" as the working name |
| Q-10 | Latin digits (1, 2, 3) or Devanagari digits (१, २, ३) in Hindi screens? | Latin digits, which most users read on prices and phones |

---

## 14. Release plan
| Phase | Contents | Gate |
|---|---|---|
| **0 · Foundation** | Repo, tooling, CI, rules package, database, design tokens, i18n | Schema and security review |
| **1 · Core marketplace** | Sign-up, profiles, listings, media, alerts, bids, calls, deals, expiry | Security review before real phones and real SMS |
| **2 · Pilot operations** | Admin console, verification, moderation, reference prices, metrics dashboard | Pilot readiness review |
| **3 · Pilot** | 60-day cluster pilot (§9) | Go / no-go |
| **4 · Scale and revenue** | Next clusters, Buyer Pro, boosts, masked calling, more languages | After go |
