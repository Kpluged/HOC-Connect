# HOC Elite Wheels — Build Brief & Claude Code Prompt

*Product name: **HOC Elite Wheels**.*
*Revision 3 — live dispatch committed; brand mark integrated; colour & type follow the Porsche Design System.*

---

## 1. What we're building (in one breath)

An ecommerce-style marketplace where a person acquires and runs their **own branded ride-dealing business** without ever driving. HOC supplies brand-new electric vehicles; the customer browses and selects models like products in a store, applies, is approved, and receives a fleet that operates under **their own brand** — dispatching **live rides** and monitoring everything from a dashboard, their "space." Amazon's store surface fused with a Porsche configurator, sitting on top of a real ride-hailing operation the owner controls but never has to drive.

The product being sold is not a car. It's a **turnkey, ownable, live ride business**.

### The core loop
1. **Discover** — a cinematic storefront presents the EV models and the ownership proposition.
2. **Configure & Apply** — pick vehicle(s), brand name, city; submit an application with identity + eligibility checks.
3. **Get Approved & Provisioned** — HOC allocates vehicles; the owner's branded space and live service go live.
4. **Operate & Earn** — the owner dispatches and monitors live rides, drivers, fleet health, and earnings from the dashboard.

---

## 2. Surfaces (now four, because rides are live)

- **The Storefront** (public, marketing-led): sells the dream. Porsche-grade.
- **The Owner Space** (authenticated, white-labelled): the owner's control room — **live dispatch**, fleet, drivers, earnings, branding.
- **The Driver App** (mobile): accept trips, navigate, stream live location, go on/offline. React Native / Expo.
- **HOC Console** (internal admin): vehicle inventory, application review, allocation, oversight across all tenants.

*(One open decision on the rider/demand side — see §10.)*

All web surfaces live in one Next.js app, separated by role and route group; the Driver App is a separate Expo project sharing the same Supabase backend and types.

---

## 3. Design direction — Porsche system, exclusive & restrained

### The thesis
Porsche's real digital identity is **precision, not decoration**: near-monochrome, whitespace-forward, letting full-bleed vehicle imagery and disciplined typography carry the emotion. Restraint *is* the luxury signal. We follow that exactly — the boldness lives in the photography, the motion, the grid precision, and a single sparing red signal.

### The brand mark
The **HOC logo is a gold, radially-symmetric ornamental emblem** (interlocking petals forming a star-flower around a hollow centre, marbled gold-leaf finish). It is used **as-is, unchanged**, as the one ornamental jewel against the monochrome system — header lockup, page loader, favicon, and a large low-opacity watermark behind hero/section breaks. Gold-on-near-black reads as pure luxury; letting the mark be the *only* ornament is what makes it land. **Do not** derive a gold UI theme from it — the interface stays monochrome + red signal.

### Colour tokens — from the Porsche Design System
Porsche ships colour via CSS `light-dark()`, so the system is dual-theme by nature. The storefront runs the **dark canvas** (faithful to Porsche's cinematic heroes); Owner Space, Driver App, and Console run `light dark` for legibility. Hierarchy comes from **translucent contrast tiers**, not extra hues.

```
/* Surfaces */
--canvas            light-dark(#FFFFFF, hsl(225 66.7% 1.2%))   /* ≈ #04060B near-black, faint blue cast */
--surface           light-dark(hsl(240 10% 95%), hsl(240 2% 10%))  /* ≈ #F0F0F3 / #1A1A1B */
--frosted           light-dark(hsl(240 5% 70% / .148), hsl(240 2% 43% / .228))  /* glass + backdrop-blur */
--backdrop          hsl(240 5.3% 14.9% / .5)                    /* modal/menu scrim */

/* Foreground — text hierarchy via opacity, not colour */
--primary           light-dark(hsl(225 66.7% 1.2%), hsl(225 100% 99%))  /* ≈ #04060B / #FCFDFF */
--contrast-higher   light-dark(rgba(black 0.8), rgba(white 0.78))
--contrast-high     light-dark(rgba(black 0.7), rgba(white 0.67))
--contrast-medium   light-dark(rgba(black 0.6), rgba(white 0.56))   /* secondary text */
--contrast-low      /* decorative only — hairlines, dividers (not a11y text) */

/* Signal — used sparingly */
--signal-red        #D5001C            /* Porsche Guards Red — the one signal: live trips, active states, key CTA */
--focus             #1A44EA            /* DS focus outline for :focus-visible */

/* Semantic (forms/notifications) */
--success  hsl(157 84.9% 41.6%)   --warning hsl(28 90.2% 56.1%)
--error    hsl(0 96.9% 62%)        --info    hsl(210 100% 54.5%)
```
Discipline rule: **red is a signal, never a theme.** It marks what's live — an in-progress trip, an active driver, a ticking earning, the primary hero action — and nothing else. The gold logo and the red signal are the only two non-monochrome things on screen, and they never touch the same element.

### Typography — the Porsche method
Porsche uses **one engineered grotesque for everything** — display, headings, body, figures — in three weights (`normal`, `semibold`, `bold`) on a **fluid** scale, generous spacing at large sizes. No serif, no separate mono.

**Important:** *Porsche Next* is proprietary and HOC cannot license it, so we follow the **method**, not the file:

```
Typeface (shipping)  → Inter        (closest free match to Porsche Next's engineered neutrality)
Weights              → 400 / 600 / 700   (mirror Porsche's three)
Scale                → fluid (clamp-based); display for hero/stats, headline for sections, text for body
Numbers              → same face (range, kWh, ₦ earnings, live fares) — no separate mono
Detailing            → generous letter-spacing + line-height on large display; tight, precise body
```
Nearest paid alternatives if HOC ever wants closer: *Söhne* or *Neue Haas Grotesk*. Inter ships today and is faithful.

### Motion language (core Porsche)
- **Lenis** weighted smooth scroll.
- **GSAP + ScrollTrigger** full-bleed vehicle reveals — each EV rises from the dark canvas, spec figures counting up.
- **Framer Motion** slide-out mega-menu (full-height panel over `--backdrop` scrim, staggered reveal — matching your click reference) and page transitions.
- **React Three Fiber** *(optional, hero only)* slow EV turntable.
- Hover = opacity/lightness shift, never scale-jump. Respect `prefers-reduced-motion`.

### The signature — "The Signal Line"
A single **hairline** (`--contrast-low`) threads vertically through the storefront between sections — Porsche's love of the fine rule, made into a through-line for *current* and *the flow of ownership*. It stays monochrome until something is **live**: in the Owner Space it turns **Guards Red** and pulses to real activity — every active trip on the network adds a pulse. It's the one place the product's live heartbeat becomes visible. Red only ever means *live*.

### Voice & copy
Plain, confident, engineered. Name things by what the owner controls ("Your fleet," "Dispatch," "Payouts"). Actions state the outcome ("Apply for your fleet," "Launch your space," "Assign driver"). Errors direct, never apologetic. Empty states are invitations ("No active trips. Your drivers are ready.").

---

## 4. Structural map

**Storefront** `/(marketing)` — `/`, `/vehicles`, `/vehicles/[model]`, `/how-it-works`, `/apply`, `/about`, `/contact`

**Owner Space** `/(owner)/space`
- `/space` overview — the live Signal Line, active trips, earnings, fleet status
- `/space/dispatch` **live dispatch board** — incoming requests, driver map, assign/monitor trips
- `/space/fleet` vehicles, status, telematics health
- `/space/drivers` roster, onboarding, assignment, live status
- `/space/brand` name, logo, livery — white-label controls
- `/space/earnings` payouts & history
- `/space/settings`

**Driver App** (Expo) — auth, on/offline toggle, trip offers, navigation handoff, live location streaming, earnings summary

**HOC Console** `/(admin)` — inventory, application review & approval, vehicle allocation, cross-tenant oversight

---

## 5. Data model sketch (multi-tenant from day one)

Every owner is a **tenant**; isolation is enforced with Supabase Row-Level Security, not app logic.

```
organizations   (tenant: name, slug, logo, livery, city, status)
profiles        (user ↔ organization, role: owner | driver | hoc_admin | rider?)
vehicle_models  (HOC catalogue: name, range_km, battery_kwh, images, price/terms)
vehicles        (unit: model_id, org_id?, vin, status, telematics_id)   ← allocated on approval
applications    (org_id, applicant, requested_models[], kyc_status, decision, timestamps)
drivers         (org_id, profile_id, status, current_location(geog), assigned_vehicle_id)
trips           (org_id, vehicle_id, driver_id, rider_ref, pickup(geog), dropoff(geog),
                 status, fare, requested_at, matched_at, completed_at)
trip_events     (trip_id, type, payload, at)        ← live status stream / audit
payouts         (org_id, amount, period, status, provider_ref)
```
`current_location` and pickup/dropoff use **PostGIS `geography`**. RLS golden rule: a row is visible only where `org_id` matches the requester's org (HOC admins excepted). Write these policies first.

---

## 6. Stack (locked — now includes the real-time layer)

**Web & core**
- **Next.js (App Router) + TypeScript** — storefront + owner space + admin via route groups.
- **Tailwind** + **Framer Motion** + **Lenis** + **GSAP/ScrollTrigger**; **React Three Fiber** for the hero only.
- **Supabase** — Postgres, Auth, Storage, **RLS**, **Realtime**, **PostGIS**.
- **tRPC** + **Drizzle** for end-to-end type safety — not GraphQL for the backbone.
- **Paystack** (subaccounts / split payments) for owner payouts and ride fares — **not** Stripe (no local NGN acquiring/payouts).
- **Prembly** for application + driver identity/eligibility (NIN/passport).
- **Vercel** (web) + **Supabase** (managed).

**Real-time ride layer (committed, since owners dispatch live rides)**
- **PostGIS** for geospatial storage + nearest-driver queries.
- **Mapbox GL** (web maps, geocoding) + **Mapbox Directions/Matrix** (routing, ETAs) + **Mapbox Navigation SDK** (in the driver app).
- **Supabase Realtime** for live driver locations and trip-status streaming to the dispatch board.
- **Driver app: React Native + Expo** — background location, push (Expo Notifications), reuses your React/TS skills and the shared Supabase types.
- **Dispatch/matching**: start with a Postgres/PostGIS nearest-available query the owner can auto- or manually-assign from; move heavy matching to an **edge function** or small worker as volume grows.
- **Background jobs** (payouts, notifications, trip lifecycle): **Inngest** or **Trigger.dev** — TS-native.
- **Telematics**: brand-new EVs → OEM/aftermarket telematics API for live location, battery, and health into the fleet view.

---

## 7. Build phasing (dispatch is committed, but sequence protects the timeline)

- **Phase 1 — the sellable surface + skeleton ops** *(build now, in Claude Code):* storefront, vehicle lineup + configurator, application flow with Prembly, auth + roles, multi-tenant Owner Space, and the **dispatch board + driver app in a working "single-city, manual-assign" form** (real map, real live location, real trip lifecycle — matching kept simple). HOC Console for review/allocation. This is a demoable, genuinely-live product the CEO can ride through end to end.
- **Phase 2 — scale the operation:** automated matching, surge/pricing logic, telematics ingestion, automated payouts, multi-city, and hardening the realtime layer for load.

---

## 8. ⤵ PASTE THIS INTO CLAUDE CODE

> Self-contained prompt for the **web app (Phase 1)**. The Expo driver app is a follow-on prompt against the same Supabase project.

---

**Role:** You are a lead full-stack engineer and UI/UX designer. Build with restraint and precision. Do not produce templated defaults.

**Project:** Build **HOC Elite Wheels**, a multi-tenant marketplace where customers acquire and run their own **branded electric-vehicle ride-dealing business** without driving. HOC supplies the EVs; customers browse models like products, apply, get approved, receive a fleet under their own brand, and then **dispatch and monitor live rides** from a dashboard ("their space"). Selling a *turnkey, ownable, live ride business*, not a car.

**Stack (use exactly this):**
- Next.js (App Router) + TypeScript, Tailwind CSS.
- Framer Motion, Lenis (smooth scroll), GSAP + ScrollTrigger. React Three Fiber for the hero only.
- Supabase (Postgres, Auth, Storage, **Row-Level Security**, **Realtime**, **PostGIS**).
- tRPC (typed end-to-end) + Drizzle for schema.
- Mapbox GL + Mapbox Directions/Matrix for the live map, routing, and ETAs.
- Paystack for payments/payouts (subaccounts + split payments). Prembly for identity verification (stub behind a typed service to wire real keys later).
- Target Vercel for deploy.

**Architecture:**
- One app, three route groups: `(marketing)`, `(owner)`, `(admin)`.
- Multi-tenant: every owner is an `organization` (tenant). Enforce isolation with Supabase RLS — a row is visible only where `org_id` matches the requester's org; HOC admins bypass. Write the RLS policies as part of the schema.
- Schema (Drizzle + SQL migrations): `organizations, profiles, vehicle_models, vehicles, applications, drivers, trips, trip_events, payouts` per the model in this brief. Use PostGIS `geography` for driver location and trip pickup/dropoff.

**Design system — follow the Porsche Design System (Tailwind theme tokens + CSS vars via `light-dark()`):**
- Near-monochrome. Surfaces: `--canvas light-dark(#FFFFFF, hsl(225 66.7% 1.2%))`, `--surface light-dark(hsl(240 10% 95%), hsl(240 2% 10%))`, frosted glass `light-dark(hsl(240 5% 70% / .148), hsl(240 2% 43% / .228))` + backdrop-blur, scrim `hsl(240 5.3% 14.9% / .5)`.
- Text hierarchy via translucent contrast tiers, not extra hues: `--primary light-dark(hsl(225 66.7% 1.2%), hsl(225 100% 99%))`, then contrast-higher/high/medium at descending opacity. contrast-low = decorative hairlines only.
- Signal colour: Guards Red `#D5001C`, **sparingly** — live trips/active states and the single primary hero CTA only, never a general accent or theme. Focus outline `#1A44EA`. Standard semantic colours for forms/notifications.
- **Brand mark:** the HOC logo is a gold ornamental emblem, used **as-is** in the header, as the page loader, favicon, and a large low-opacity watermark behind hero/section breaks. Do NOT derive a gold UI theme from it — the interface stays monochrome + red signal. (Logo file provided at `/public/brand/hoc-logo.png`.)
- Storefront runs the **dark canvas**; owner space and console follow `light dark`.
- Typography: **one engineered grotesque for everything** — ship **Inter** (closest licensable match to Porsche's proprietary Porsche Next, which we cannot use), weights 400/600/700, fluid clamp-based scale. Display for hero/stats, headline for sections, text for body. **All numbers** (range, kWh, ₦ earnings, live fares) in the same face — no serif, no separate mono. Generous letter-spacing/line-height on large display; precise body.
- Motion: Lenis smooth scroll; GSAP ScrollTrigger reveals where each vehicle rises from the dark canvas with spec figures counting up; Framer Motion slide-out mega-menu (full-height panel over the scrim, staggered reveal) + page transitions. Hover = opacity/lightness shift, no scale-jump. Respect `prefers-reduced-motion`.
- **Signature — "The Signal Line":** a vertical hairline (contrast-low) threading between storefront sections; in the Owner Space it turns Guards Red and pulses to live trip activity via Supabase Realtime. Red only ever means live.
- Voice: plain, confident, engineered. Label by what the owner controls. Buttons state the outcome ("Apply for your fleet", "Launch your space", "Assign driver"). Errors direct; empty states are invitations.

**Build Phase 1 now:**
1. Design tokens (`light-dark()` CSS vars + Tailwind theme) + global styles + Lenis provider + Inter 400/600/700 + brand-mark lockup/loader/favicon from `/public/brand/hoc-logo.png`.
2. Storefront: `/` cinematic dark-canvas hero (single EV, one statement, one action, gold watermark) + scroll-story + ownership proposition + the Signal Line; `/vehicles` product grid; `/vehicles/[model]` detail → configurator; `/how-it-works` (four-step loop); `/apply` configure fleet → application form with Prembly identity step (stubbed service).
3. Auth (Supabase) + roles: owner, driver, hoc_admin.
4. Owner Space: `/space` overview (live Signal Line, active trips, earnings, fleet); `/space/dispatch` **live dispatch board** — Mapbox map with live driver markers (Supabase Realtime), incoming trip requests, manual assign, and live trip-status tracking end to end; `/space/fleet`; `/space/drivers`; `/space/brand` (name/logo/livery); `/space/earnings` (Paystack payouts, mock data ok); `/space/settings`. Frosted surfaces on canvas, red only for live/active, figures in the body face.
5. HOC Console: inventory, application review + approval, vehicle allocation to an org.
6. Seed data: **EV models are not yet decided** — seed 4–6 placeholder models (generic names, plausible range/battery) clearly marked as placeholders, so the storefront and grid render fully and models are trivial to replace later. **Vehicle imagery will be supplied as a folder of images** at `/public/vehicles/` — map images to models by filename, populate hero/grid/model pages/configurator from it, and use tasteful placeholders only where a specific image is missing. Seed a couple of demo trips + drivers with coordinates so the dispatch board and map are live on first run.

**Quality floor:** responsive to mobile, visible keyboard focus (`#1A44EA`), reduced-motion respected, semantic HTML. Identity is Porsche's monochrome-plus-sparing-red system with a single engineered grotesque and the gold mark as the only ornament — no second accent colour, no decorative serif. Ask me before inventing brand copy that asserts facts about HOC.

Start by proposing the file/route structure and the Drizzle schema (with PostGIS + RLS policies), then build the design tokens and the storefront hero. Show me each milestone before moving on.

---

## 9. Driver App (follow-on, same backend)

Once the web app's schema and Realtime are in, scaffold a separate **Expo (React Native) + TypeScript** app against the same Supabase project: auth, on/offline toggle, incoming trip offers (push via Expo Notifications), accept/decline, Mapbox Navigation SDK handoff, background live-location streaming into `drivers.current_location`, and an earnings summary. Reuse the shared Drizzle/Supabase types.

---

## 10. The one open decision — the rider/demand side

Owners dispatch live rides, which means riders and ride *requests* enter the system. How that demand arrives changes scope, so I need your call on one of these:

- **A) Branded rider booking app/web per owner** — HOC Elite Wheels provides a white-labelled consumer surface where riders request rides from a specific owner's brand. (Largest scope: adds a rider app + public request flow.)
- **B) Owner-side dispatch console only** — ride requests come in through the owner's own channels (call centre, corporate contracts, a form), and the owner assigns them to drivers from the dispatch board. (Medium scope — this is what Phase 1 above assumes by default.)
- **C) Aggregator/integration** — rides flow in from an external source/partner via API, and the platform dispatches them.

Phase 1 is written for **(B)** as the sensible default. Tell me which is real and I'll adjust the model (a `rider` role + request flow for A, or an inbound API for C).

---

## 11. What I still have open

1. **The three menu/scroll screenshots** — the logo landed; the screenshots didn't. Re-attach and I'll match the mega-menu behaviour and header exactly.
2. **Rider/demand model** — the §10 decision (A / B / C).
3. **EV models** — currently placeholder; send names + range/battery when known, to pair with the `/public/vehicles/` image folder.
4. **HOC's own red, if it has one** — I've used Guards Red `#D5001C` as the single signal; if HOC has a brand red, we swap that one token and the system updates.

Send those and I'll refine the prompt and start scaffolding.
