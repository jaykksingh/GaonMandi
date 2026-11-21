# GaonMandi design specification v1.0 (MVP)

The implementation contract for the Android app and the admin console. Product rules: [PRD](PRD.md). Exact values: `design/tokens.json` (W3C design-token format) and `design/tokens.css` (`--gm-*` custom properties, generated from the JSON).

**Status:** the clickable design canvas is not drawn yet (pilot plan, weeks 1–2). Until it exists, this file is the source of truth for screens. When the canvas exists, the canvas wins over this file, and this file wins over code. Change the canvas, the tokens and this file in the same pull request.

---

## 1. Design principles
1. **Icons first, words second.** Every action has an icon and a short Hindi label. A seller who reads little can still finish a listing.
2. **One big action per screen.** The main button is full width, at the bottom, at least 56 dp tall.
3. **Readable in sunlight.** High contrast (at least 7:1 for body text), no light grey text on white, no thin fonts.
4. **Wet hands and gloves.** Touch targets at least 48 × 48 dp, 8 dp apart. No swipe-only actions.
5. **Show time left.** Every listing shows its freshness timer in words and colour.
6. **Never look like a bank.** No ₹ balance, wallet or "Pay" button anywhere (PRD §1).
7. **Works on a ₹7,000 phone.** No heavy animation, images sized for the screen, dark text on light backgrounds.

## 2. Foundations

### 2.1 Colour roles
| Role | Tokens | Use |
|---|---|---|
| Surfaces | `bg.canvas`, `bg.surface`, `bg.subtle` | Screen background, cards, input fields |
| Text | `text.primary`, `text.secondary`, `text.inverse`, `text.disabled` | Body and figures, supporting text, on dark, disabled |
| Brand | `brand.default`, `brand.strong`, `brand.soft`, `brand.onBrand` | Main buttons, active tab, links |
| Fish | `fish.default`, `fish.soft` | Fish, prawn and crab category chips and icons |
| Crop | `crop.default`, `crop.soft` | Vegetable, grain and fruit category chips and icons |
| Freshness | `fresh.ok`, `fresh.soon`, `fresh.urgent`, plus `*.soft` | Timer chip: more than 50% left, 20–50% left, under 20% left |
| Bid | `bid.highest`, `bid.soft` | The highest bid on a listing |
| Danger | `danger.default`, `danger.soft` | Errors, report and block actions |
| Lines | `border.default`, `border.strong` | Card edges, input borders |

Status is never shown by colour alone: the timer chip always has text ("2 घंटे बचे"), and the highest bid has a label.

### 2.2 Typography
- **Noto Sans Devanagari** for Hindi and **Noto Sans** for English and figures; weights 400, 600 and 700 only.
- Sizes (sp): `display` 32/700 (price on a listing detail), `title` 22/700, `heading` 18/600, `body` 16/400, `bodyStrong` 16/600, `label` 14/600, `caption` 13/400. **Nothing below 13 sp.**
- Line height 1.4 for Devanagari (taller letters and matras), 1.3 for Latin.
- Figures use tabular digits so prices line up.

### 2.3 Spacing, radius, elevation
- Spacing on a 4 dp grid: 4, 8, 12, 16, 20, 24, 32, 40.
- Radius: `sm` 8 (chips), `md` 12 (inputs, buttons), `lg` 16 (cards), `full` (avatars, timer chips).
- Flat UI with 1 dp borders. One shadow token, `shadow.sheet`, for bottom sheets and dialogs.

### 2.4 Icons
- **Category icons** are filled, two-tone illustrations at 48 dp in the grid and 24 dp in chips: fish, prawn, crab, leafy greens, tomato, potato, onion, brinjal, okra, cauliflower/cabbage, gourd, chilli, other vegetable, grain, fruit. Fish group uses `fish.*`, crop group uses `crop.*`.
- **UI icons:** Lucide (`lucide-react-native`), stroke 2, 24 dp: camera, mic, phone, plus, clock, map-pin, gavel (bid), check, flag (report), ban (block), bell, user, house.
- No emoji in the UI.

### 2.5 Motion
150–200 ms fades only. No motion when the system's "remove animations" setting is on. No spinners on cards; use skeleton blocks.

## 3. Layout
- Single-column mobile layout, 16 dp side padding, designed at 360 × 640 dp and checked at 320 dp wide.
- **Bottom tab bar** (seller): Home (मेरी बिक्री), Sell (बेचें, centre, raised), Deals (सौदे), Profile. **Buyer:** Nearby (आस-पास), My bids (मेरी बोली), Deals (सौदे), Profile. A user with both roles gets a role switch at the top of Home.
- Main action button fixed at the bottom above the tab bar, full width, 56 dp.
- Admin console: desktop layout, sidebar 240 px, content max width 1440 px.

## 4. Components
| Component | Spec |
|---|---|
| **PrimaryButton** | 56 dp tall, `brand.default`, `text.inverse` `bodyStrong`, radius md, icon left; disabled uses `bg.subtle` and `text.disabled`; loading shows the label "भेजा जा रहा है…" |
| **SecondaryButton** | 48 dp, 1 dp `border.strong`, `text.primary` |
| **CategoryTile** | 96 × 104 dp, icon 48 dp, label `label`, radius lg; selected: 2 dp `brand.default` border plus a check badge |
| **QuickChip** | 48 dp tall, radius full, `bg.subtle`; selected: `brand.soft` with `brand.strong` text; used for weights (5, 10, 20, 50 kg, 1 or 2 quintal) and radius (5, 10, 15, 20 km) |
| **NumberPad** | Large keys 64 dp, Latin digits, a decimal key only for kg |
| **FreshnessChip** | Clock icon + time left in words; colour by share left (§2.1); updates every minute; `accessibilityLiveRegion="polite"` only in the last 30 minutes |
| **ListingCard** | Photo 4:3 on top, category chip, weight in `heading`, expected rate, village + distance ("कुसुमपुर · 4 km"), FreshnessChip, bid count; for buyers, the highest bid row |
| **SellerBadge** | Face photo 40 dp circle (or the village badge: house icon on `crop.soft`) + name + village/tola |
| **BidRow** | Buyer business type icon, business name, rate per kg in `bodyStrong`, quantity if partial, time, Call and Accept buttons |
| **VoiceNoteButton** | Hold to record, up to 30 s, a timer, then a play/delete pair; 56 dp |
| **CameraScreen** | Full screen, shutter 72 dp centre, up to 3 thumbnails, "Retake"; gallery is not available |
| **OutboxBanner** | Top banner on `fresh.soon.soft`: "2 बिक्री भेजी जा रही हैं" with a retry button when offline |
| **EmptyState** | Illustration, one sentence, one action |
| **Toast** | Bottom, 4 s, text only, never contains a phone number |

## 5. Screens

### 5.1 Onboarding (both roles)
- **S-01 Language:** two large buttons, "हिंदी" (default, first) and "English".
- **S-02 Phone:** +91 prefix fixed, 10-digit field with a numeric keyboard, "कोड भेजें" (Send code). The button enables at the 10th digit.
- **S-03 Code:** 6 boxes, auto-fill from SMS, resend timer 30 s, "नंबर बदलें" (change number).
- **S-04 Role:** three tiles: Sell (बेचना), Buy (खरीदना), Both (दोनों).
- **S-05 Seller profile:** name, village picker (search plus "मेरी लोकेशन से चुनें"), tola (optional), face photo (optional, with a "बाद में" skip), consent screen.
- **S-06 Buyer profile:** name, business type tiles, business name, market/town picker, radius chips, category grid (multi-select), WhatsApp opt-in switch, consent. Then a "जांच बाकी है" (verification pending) state until a field agent verifies.

### 5.2 Seller
- **S-10 Home (मेरी बिक्री):** OutboxBanner if needed; live listings as ListingCards sorted by time left; past listings collapsed below; EmptyState "अपनी पहली फसल या मछली बेचें" with the Sell button.
- **S-11 Sell, step 1 Category:** 3-column CategoryTile grid; fish group first in fishing villages (cluster setting).
- **S-12 Sell, step 2 Photo:** CameraScreen; "आगे" (Next) after the first photo.
- **S-13 Sell, step 3 Weight and rate:** weight QuickChips plus NumberPad, unit toggle kg / क्विंटल; optional "आपका रेट ₹/किलो"; optional "आम तौर पर व्यापारी कितना देता है?" (usual vendor rate).
- **S-14 Sell, step 4 Freshness and voice:** FreshnessChip preset with − / + steps inside the limits; VoiceNoteButton; summary row; PrimaryButton "बेचें" (Publish).
- **S-15 Listing detail (seller):** photos, weight, timer, bid list (BidRow, highest first), actions: Extend (once), Sold elsewhere, Cancel. Accept opens a confirm sheet: "₹200/किलो पर असिफ़ को बेचें?".
- **S-16 Deal (seller):** buyer, agreed rate, Call, "उठा लिया गया" (Picked up), final rate (pre-filled), thumbs up/down, report no-show.

### 5.3 Buyer
- **S-20 Nearby (आस-पास):** category filter chips at the top, ListingCards newest first; unverified buyers see a "जांच बाकी है" banner and no Call/Bid buttons.
- **S-21 Listing detail (buyer):** photo carousel, SellerBadge, weight, expected rate, distance, FreshnessChip, voice note player, highest bid row, two buttons: "बोली लगाएं" (Bid) and "कॉल करें" (Call; hidden when the seller has calls off, with the note "विक्रेता केवल बोली लेते हैं").
- **S-22 Bid sheet:** rate per kg with − / + ₹5 steps from the highest bid, optional quantity, "बोली भेजें".
- **S-23 My bids:** active, accepted and closed bids.
- **S-24 Deal (buyer):** seller, rate, Call, Picked up, thumbs up/down.

### 5.4 Shared
- **S-30 Notifications** list. **S-31 Profile:** name, photo, village or market, calls on/off (seller), radius and categories (buyer), quiet hours, language, help (field agent number), delete account. **S-32 Report** sheet with reason tiles. **S-33 Suspended** notice.

### 5.5 Admin console
- **A-01 Buyers to verify:** table with name, business type, market, signed up, Verify / Reject with a note.
- **A-02 Reports:** queue with reason, target, reporter count, actions.
- **A-03 Cluster:** villages on a map and in a table; edit points and names.
- **A-04 Reference rates:** a week × category grid in ₹/kg.
- **A-05 Pilot dashboard:** the PRD §5 metrics, daily and weekly, with targets marked.

### 5.6 States every screen handles
Loading (skeleton), empty, offline (OutboxBanner or "इंटरनेट नहीं है" banner), error (retry), verification pending (buyer), suspended.

## 6. Content and formatting
- **Simple spoken Hindi**, not formal or Sanskrit-heavy: "बेचें", not "विक्रय करें"; "बोली", not "निविदा".
- Money: "₹1,250", "₹180/किलो"; never decimals for rupees in the app unless the paise part is non-zero.
- Weight: "5 किलो", "1.5 क्विंटल"; under 1 kg is not allowed.
- Distance: "4 km" (Latin), rounded to whole km, minimum "1 km".
- Time left: "3 घंटे 20 मिनट बचे", "15 मिनट बचे", "समय खत्म".
- Times: "सुबह 7:30", "शाम 5:00" (IST).
- Digits: Latin digits in both languages.
- Names: shown as given; never show a phone number on screen except inside the system dialer.
- Every string comes from `packages/i18n`; no hard-coded text in components.

## 7. Accessibility
- TalkBack labels on every icon button ("मछली श्रेणी", "कॉल करें").
- Content descriptions on category tiles include the name; photos have "विक्रेता की फोटो" labels.
- Respect font scaling up to 130% without cutting text; layouts wrap.
- Contrast: body text ≥ 7:1, large text and icons ≥ 4.5:1 (checked by the token validator).
- Voice notes always have a visible play button and duration.

## 8. Performance budget
- APK < 25 MB; cold start < 3 s on a 2 GB RAM phone.
- Feed first page < 30 KB JSON plus 320 px thumbnails (about 25 KB each).
- Listing upload under 400 KB total for 2 photos and a voice note.

## 9. Design QA checklist (each screen)
- [ ] Every value from a token; no raw colours or sizes in components.
- [ ] Hindi and English both fit at 320 dp wide and 130% font scale.
- [ ] Touch targets ≥ 48 dp; main action ≥ 56 dp.
- [ ] All states in §5.6 exist.
- [ ] TalkBack reads every control in a sensible order.
- [ ] No phone number, exact location or payment wording on screen.
