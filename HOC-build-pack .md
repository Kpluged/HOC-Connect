# HOC Elite Wheels — Ride Dealership Platform
### House Of Cersei · HOC Capital Club
## Build pack for Claude Code / Codex / Lovable

Paste sections into your coding agent in the order given. Section 0 is the system brief — always include it. Sections 5.x are the phased build prompts.

---

## 0. System brief (always paste first)

You are building **HOC Elite Wheels**, the platform product of HOC Capital Club (legal entity House Of Cersei). "HOC Elite Wheels" is the application name shown in the UI, an e-commerce platform for buying and operating a *branded electric ride-hailing service*.

A customer does not buy a car. They buy a **turnkey ride service outright**: they choose an operating city, a fleet size and a vehicle mix, name and brand the service, pay for a fleet package in full (10% reservation deposit, balance before delivery), and sign a programme agreement. HOC Elite Wheels supplies the electric vehicles, sources and licenses the drivers, provides charging access, maintenance and the dispatch software. The customer is an owner-operator with minimal day-to-day involvement: they watch a cockpit, take payouts and grow their fleet.

**The buyer has never run a fleet.** This is the single most important product constraint. Assume no knowledge of vehicle procurement, driver vetting, charging economics or ride-hailing operations. Every number is explained where it appears, every step of the purchase says what happens next and who does it, and every operational term gets a one-line plain-English definition on first use. Confidence comes from clarity, not from hiding complexity.

Launch market is **Lagos, Nigeria**, currency **NGN (₦)**, timezone Africa/Lagos. Build multi-city and multi-currency from the start but ship Lagos only.

Three audiences, one codebase:

1. **Prospect** — a first-time owner: browses vehicles and packages, configures a fleet, applies, pays.
2. **Owner** — post-purchase cockpit: fleet, drivers, charging, earnings, brand studio.
3. **HOC Elite Wheels internal** — applications queue, inventory allocation, city slots, driver supply, billing.

The product is positioned as luxury automotive commerce, not a gig-economy tool. Reference the interaction *patterns* of premium car-maker sites (full-bleed vehicle photography, overlay navigation with a live preview pane, large numeric specification blocks, sticky configurator summary) — but all visual identity, copy and layout is HOC's own, per the design system in section 2. Do not copy any manufacturer's marks, model names, fonts or exact layouts.

**Engineering stack** (fixed): Next.js App Router + TypeScript, Tailwind CSS with the tokens in section 2 mapped into `tailwind.config.ts`, server components by default, Zod for validation. **Supabase** for Postgres, Auth (email + phone OTP, appropriate for the Lagos market), Row Level Security on every table, Storage for KYC documents and brand marks, and Realtime for live fleet telemetry in the cockpit. **Paystack** primary for the reservation deposit and balance payment (bank transfer and card, NGN), with the payment provider behind an adapter interface so Flutterwave or Stripe can be added. Resend for transactional mail. No component library — build the primitives listed in section 3, they are few and specific. Accessibility: WCAG 2.2 AA, full keyboard paths through the configurator and overlay nav, `prefers-reduced-motion` respected everywhere.

---

## 1. Domain model

```
User            id, email, name, phone, role[prospect|owner|staff|admin], createdAt
Operator        id, userId, tradingName, slug, brandMark, accentColor, city, status[draft|applied|approved|live|suspended]
City            id, name, country, currency, timezone, slotsTotal, slotsAvailable, launchDate
VehicleModel    id, name, class[sedan|suv|van], rangeKm, dcChargeMinutes, seats, dutyCycleHrs,
                heroImage, gallery[], available[true|waitlist], unitPriceMinor, currency
FleetPackage    id, name, vehicleCount, includedMonths[charging|maintenance|driverSupply],
                basePriceMinor, currency, cityId, description
FleetConfig     id, userId, cityId, items[{vehicleModelId, qty}], liveryId, packageId,
                status[draft|submitted], totalMinor, currency, resumeToken
Application     id, userId, fleetConfigId, companyDetails, kycDocs[],
                status[submitted|in_review|approved|declined], reviewerId, notes[]
Order           id, applicationId, operatorId, totalMinor, currency,
                depositMinor, depositPaidAt, balanceDueAt, balancePaidAt,
                status[reserved|deposit_paid|paid_in_full|delivered|cancelled]
Payment         id, orderId, provider[paystack], providerRef, kind[deposit|balance],
                amountMinor, currency, status[pending|succeeded|failed], paidAt
Contract        id, applicationId, planTerms, signedAt, signatureRef, documentUrl
Vehicle         id, operatorId, vehicleModelId, plate, vin, stateOfCharge, odometerKm,
                status[on_trip|charging|idle|maintenance|fault], lastSeenAt, location{lat,lng}
Driver          id, operatorId, name, licenceRef, status[active|inactive|pending_vetting], rating
Shift           id, driverId, vehicleId, startAt, endAt, tripsCount, grossRevenue
Trip            id, vehicleId, driverId, startAt, endAt, distanceKm, fare, energyKwh
MaintenanceTicket id, vehicleId, type, openedAt, closedAt, severity, notes
Payout          id, operatorId, periodStart, periodEnd, grossRevenue, costs{energy,fees,maintenance}, net, status
Invoice         id, operatorId, periodStart, periodEnd, amountMinor, currency, kind[service_fee|energy|maintenance], status[due|paid|overdue]
```

Rules to enforce in code:
- Fleet size cannot exceed `City.slotsAvailable`; over-capacity choices render as **waitlist**, never hidden.
- `FleetConfig` is resumable by URL and survives logout (guest token → merged on sign-in).
- Every currency amount stored in minor units with an explicit currency code; never a bare number.
- `Operator` branding drives the cockpit chrome and the rider-app theme — one accent colour only.
- The purchase is **one-time**: no subscription objects. Recurring charges after delivery are service invoices (energy, maintenance, platform fee), issued monthly against the operator.
- Vehicles are only provisioned once `Order.status = paid_in_full`; city slots are held at `reserved` and released automatically if the deposit expires (7 days) or the balance lapses.
- All Supabase tables carry RLS: an owner reads only their operator's rows; staff read via a service role behind server actions only.
- Telemetry (`Vehicle.stateOfCharge`, `location`) is read-only from an adapter; mock it behind `lib/telemetry/` so the provider can be swapped.

---

## 2. Design tokens

Direction **v2 — automotive monochrome** (see `HOC Design Direction v2.dc.html`). White canvas, grey panels, near-black type, one neo-grotesque, HOC gold as the only accent. The dark room survives on exactly one route: the owner cockpit.

```
Colour
  white       #FFFFFF   canvas — every public and commerce route
  grey05      #F0F1F2   panel, grouping, image plate
  grey10      #E4E6E8   secondary button, inner plate
  grey55      #6B6E73   captions, units, secondary text
  grey35      #9CA0A6   disabled, waitlist, tertiary
  ink         #101214   type, primary button, section rules
  ink70       #3A3D42   body copy
  aurum       #B08F3C   SOLE accent — mark, active step, charging, one key figure
  leaf        linear-gradient(115deg,#705010,#B08F3C 42%,#EFE6C4 68%,#A0802F)  logo mark only
  cockpitInk  #0E1013   owner dashboard canvas (the only dark route)
  cockpitLine rgba(255,255,255,.10)
  signalGreen #3F7A5E (on light) / #7CC49E (on cockpit)   on trip
  signalRed   #B4483C   fault only
  hairline    rgba(16,18,20,.12) · section rule 2px solid #101214
  currency    ₦ prefix in grey55 at ~0.45× the numeral size, outside the numeral's weight
  ratio       per screen: white 70 · grey 20 · ink 9 · gold 1

Type — one family, four weights, no serif, no second face
  stack     "Helvetica Neue", Helvetica, Arial, sans-serif
            (if licensing: any neo-grotesque with tabular figures; never a
             manufacturer's proprietary face)
  display-xl 92/90 · 500 · -3.5%      display-l 64/64 · 500 · -3%
  h2 44/48 · 500 · -3%                h3 19/26 · 500
  body 17/27 · 400 · #3A3D42          button 15 · 500 · sentence case
  caption 13/19 · 400 · #6B6E73       spec numeral 86 · 400 · -3.5%, unit 22 grey55
  no uppercase tracking anywhere; eyebrows are sentence case in grey55
  tabular figures on every numeral, counter and table
  minimums  body ≥15px · spec numeral ≥56px desktop · tap target ≥44px

Space & form
  grid 12 col, 88px page gutter desktop, 24px mobile
  radius 999px controls and chips · 8px cards · 4px fields · 0 containers
  buttons 52px tall: solid #101214 primary, #E4E6E8 secondary, hairline tertiary
  fields are white boxes on grey panels with a 1px hairline — not underlines
  no shadows, no gradients, no bordered or rounded imagery
  imagery: full-bleed, or centred on a #F0F1F2 plate with a soft contact shadow

Motion
  page enter 500ms fade + 12px rise, cubic-bezier(.16,1,.3,1)
  overlay nav 380ms wipe, rows stagger 40ms
  hover 160ms ease-out — fill and underline only, never scale
  numerals 900ms count-up, once, on first viewport entry, tabular
  totals 240ms tween on change only, never on first paint
  prefers-reduced-motion: opacity only, counters render their final value
```

Non-negotiables: one gold element per screen; photography full-bleed or centred on a grey plate, never rounded or bordered; no serif and no second typeface; the white room does the selling and the explaining, the cockpit is the only inversion.

---

## 3. Component primitives to build first

`Button` (solid/outline/text), `Explainer` (inline plain-English definition on first use of an operational term), `Chip` (neutral/selected/status), `SpecBlock` (label, numeral, unit, caption, footnote ref), `Field` (underline input, select, file), `OverlayNav` (three panes: sections / live preview / aurum bloom + close), `VehicleCard`, `ConfigStepRail`, `StickySummary`, `KpiTile`, `DataTable` (hairline rows, 18px, no zebra), `StatusDot`, `MapPanel`, `Footnotes`, `SectionHeader` (numeral + display heading).

Build them in `components/ui/` with the tokens only — no ad-hoc hex values in feature code.

---

## 4. Route map

```
/                         brand entry
/vehicles                 index, filter by class + city availability
/vehicles/[slug]          specification, spec blocks, add to fleet plan
/packages                 fleet packages, what HOC Elite Wheels supplies vs the owner
/cities                   city slots, availability, launch dates
/brand-your-service       livery, naming, rider-app preview
/operations               charging, maintenance, driver supply explained
/configure/[step]         01 city · 02 size · 03 mix · 04 livery · 05 package · 06 review
/apply/[step]             identity · company · documents · deposit · signature
/orders/[id]              order status, balance payment, delivery schedule
/account                  configurations, applications, contracts
/o/[operator]             owner cockpit — overview
/o/[operator]/fleet       fleet list + vehicle detail
/o/[operator]/drivers     roster, shifts, vetting status
/o/[operator]/energy      charging sessions, energy cost
/o/[operator]/earnings    revenue, costs, payouts, invoices
/o/[operator]/brand       brand studio (name, mark, accent, rider-app theme)
/admin/applications       queue + review
/admin/inventory          models, stock, allocation
/admin/cities             slot management
/admin/drivers            supply pool
/admin/billing            contracts, invoices, payouts
```

---

## 5. Phased build prompts

### 5.1 Foundation
> Scaffold the HOC platform: Next.js App Router + TypeScript + Tailwind. Map the section 2 tokens into `tailwind.config.ts` (colours, font families, the two font stacks, radius scale, easing curves) and load Cormorant Garamond 300 with `next/font`. Build every primitive in section 3 as an unstyled-by-default, token-only component with the states described, plus a `/styleguide` route rendering all of them in both the obsidian and bone rooms. Implement the dark/light "room" as a layout prop, not a theme toggle — pages declare which room they are in. Include the reduced-motion handling and a shared `useCountUp` hook.

### 5.2 Brand entry + vehicle catalogue
> Build `/`, `/vehicles`, `/vehicles/[slug]` from the design direction. Home: fixed transparent header that gains obsidian at 92% opacity plus a hairline after 80px of scroll; two-bar burger opening the three-pane OverlayNav (sections list left, live preview pane centre that crossfades in 220ms on section hover, aurum bloom panel right with the close button); hero with full-bleed vehicle plate, eyebrow, display-xl headline, two buttons. Vehicle detail: alternating obsidian and bone sections, SpecBlocks with count-up numerals and footnote references, gallery, "Add to fleet plan" writing into the current FleetConfig. Vehicle data from a typed seed file for now, one adapter away from the CMS.

### 5.3 Configurator
> Build `/configure/[step]` for the six steps in section 4, using ConfigStepRail (left), the working pane (centre, bone room), and StickySummary (right, obsidian). Every step is deep-linkable and resumable via `FleetConfig.resumeToken`; guest configurations merge into the account on sign-in. Enforce city slot capacity — over-capacity vehicle counts become waitlist rows with an explanatory line, never disabled silently. The summary shows the **one-time package total in ₦** plus the 10% reservation deposit and what the package includes for how many months; recalculate on every change with a 240ms number tween. Because the buyer is new to this, each step carries one short plain-English line explaining what the choice affects and who handles it afterwards. Step 06 reviews the configuration and hands off to `/apply`.

### 5.4 Application, contract, payment
> Build `/apply/[step]`: identity, company details, document upload (KYC, ID, proof of address) with client-side validation and virus-scan hook, e-signature step producing a `Contract` record and a PDF, then the 10% reservation deposit via Paystack (card and bank transfer), which creates the `Order` and holds the city slots for 7 days. `/orders/[id]` then handles the balance payment and delivery scheduling. Server-validate every step with Zod; persist partial progress; email confirmations at submission, approval and decline. Add `/admin/applications` — a reviewer queue with statuses, notes, document viewer and an approve/decline action that provisions the `Operator` and reserves city slots in one transaction. Vehicles are only created once the order is paid in full.

### 5.5 Owner cockpit
> Build the `/o/[operator]` cockpit in the obsidian room, wearing the operator's own brand (trading name, mark, single accent) with HOC reduced to a footer credit. Overview: KPI tiles (revenue, trips, utilisation, energy cost), a 24-hour utilisation bar chart, status chips and the live fleet table (vehicle, driver, state of charge, status). Then fleet detail, driver roster with vetting states, charging and energy, maintenance tickets, earnings with payout history and invoices. Read telemetry through `lib/telemetry/` with a mock adapter and a documented interface for the real provider. Never display invented figures — unwired metrics render as an explicit "awaiting telemetry" state.

### 5.6 Brand studio and rider surface
> Build `/o/[operator]/brand`: trading name, mark upload, single accent colour, vehicle livery choice, and a live preview of the rider-facing booking app themed with those values. Then scaffold the rider surface as a separate themed route group: request a ride, driver arriving, trip in progress, receipt — inheriting the operator's brand, using the same primitives at mobile scale with 44px minimum targets.

### 5.7 Hardening
> Add role-based access control across the four roles, audit logging on every state transition (application, contract, allocation, payout), rate limiting on the public forms, an admin impersonation path with audit trail, seed and demo scripts, Playwright coverage of the configurator and application happy paths, and a Lighthouse budget of 95+ performance / 100 accessibility on the public routes.

---

## 6. Reference teardown — premium automotive commerce, mapped to HOC

Walked the reference site (porsche.com) section by section. Below is what each pattern *does*, and the HOC screen it becomes. Copy the mechanics; none of the brand assets, model names, typefaces or exact layouts.

### 6.1 Home, in order of appearance

| Reference pattern | What it achieves | HOC equivalent |
|---|---|---|
| Full-bleed model hero: one vehicle, one line of copy, one "Discover more" link | Single subject, zero UI noise, brand before commerce | Frame A. Eyebrow "Fleet packages · Lagos", display headline, two CTAs — copy left, vehicle plate right |
| Stacked editorial hero sequence — three or four full-viewport vehicle statements, each captioned with just the model name | Scroll becomes a slow reveal, not a feed | Three full-bleed statements: the vehicle, the city, the owner's livery. Caption only |
| Model grid: image, drivetrain tags (Electric / Hybrid / Gasoline), one-line description ("Sporty compact SUV: 4 doors, 5 seats"), "From $X*", two CTAs — "Build your own" + "Explore the model" | Every card is both a spec summary and a fork: configure now, or read more | `/vehicles` grid: image, tags (Electric · seats · range), one-line role description ("City sedan: 4 doors, 4 seats"), "From ₦X*", CTAs "Add to fleet plan" + "Explore" |
| Unavailable models kept in the grid with "Model currently unavailable for order" and an alternate CTA | Honesty over hiding; keeps desire alive | Waitlist state on vehicles and on city slots — shown, explained, never silently disabled |
| Asterisked price footnote in small grey type under the grid | Legal clarity without breaking the layout | Footnote component: what the package price includes and excludes, ₦, VAT, delivery, registration |
| Dealer locator block: photo, short pitch, "Search now" | Converts browsing into a local, human next step | "Cities & slots": Lagos coverage, slot release schedule, "Reserve a slot" |
| Inventory finder: location input + browse offers | Availability search on real stock | Fleet availability finder: city + fleet size → what can be delivered this quarter |
| Shop band with three category tiles | Adjacent commerce, visually lighter than the vehicle content | Owner extras: livery packs, branded rider-app themes, charging hardware |
| "Discover" trio of editorial teasers (Approved, Travel & Experience, Motorsport) | Brand depth after the transactional content | "The programme": how HOC vets drivers, how charging works, owner stories |

### 6.2 Overlay navigation (screenshot 1)

Three vertical panes over the full viewport: a section list on the left, a live preview pane in the middle that changes with the hovered/selected section, and a third atmospheric pane on the right holding the close button. Rows carry a chevron; the selected row is filled; the account entry sits at the foot of the list, separated by a rule.

HOC: identical mechanics, HOC's own material. Left — Vehicles, Fleet packages, Brand your service, Cities & slots, Operations & care, The programme, then Owner account at the foot. Middle — the live preview: for Vehicles it lists the models with range and tags; for Cities it lists slot availability; for Packages it lists the tiers. Right — the aurum bloom panel with the ✕ at top-left; clicking anywhere on it closes. 220ms crossfade of the middle pane, 380ms wipe on open, rows stagger 40ms, full keyboard path, focus trapped, Escape closes.

### 6.3 Specification section (screenshot 2)

A light room. Left column: three or four numerals at ~80px with small units and a caption beneath each ("Electric range combined", "Acceleration 0–100 km/h", "Top speed"), a "details of the measuring method" line, then two buttons — one solid dark primary, one grey secondary. Right: the vehicle on a plain floor, no environment. Superscript references resolve to centred footnotes at the foot of the section.

HOC: same block, fleet-relevant figures — range, DC charge time, duty cycle per charge, seats. Buttons become "Add to fleet plan" and "Full specification". Footnotes state test conditions and Lagos-specific assumptions (traffic, temperature, charger power). Numerals count up once on first entry into the viewport.

### 6.4 Patterns worth stealing beyond those screens

- **Sticky in-page nav** on vehicle pages: section anchors appear as a slim bar after the hero and follow the scroll. Use it on `/vehicles/[slug]` and on the package pages.
- **Configurator with a permanent price rail**: choices left, subject centre, running total right, always visible, always deep-linkable. This is exactly frame D — with a one-time ₦ package total and 10% deposit line instead of a monthly figure.
- **Comparison view**: two or three vehicles side by side on the same spec rows. HOC needs this for package tiers as much as vehicles.
- **Gallery with an "exterior / interior / details" switcher**, images full-bleed, never in rounded cards.
- **Editorial long-form pages** (heritage, experience) with alternating full-bleed image and centred text at 60ch. HOC uses these for "The programme" and for driver vetting.
- **Persistent, quiet utility rail** — account, saved configurations, dealer/city — top right, text only, no icons except the account glyph.
- **Model availability language** everywhere: what can be ordered, what is waitlisted, what launches next quarter.

### 6.5 Prompt to paste for the reference-derived behaviour

> Implement the interaction patterns in section 6 exactly as described: the three-pane overlay navigation with a live middle preview pane, the model grid card with tags, one-line role description, "From ₦X*" and dual CTAs, the footnoted specification block with count-up numerals, the sticky in-page section nav on vehicle and package pages, the comparison table for packages, and the configurator's permanent right-hand total rail. Reproduce the *mechanics and information hierarchy* only — all type, colour, spacing, imagery and copy come from the HOC design direction in section 2. Do not use any car manufacturer's marks, model names, typefaces, photography or page copy.

## 7. Guardrails for the agent

- Never invent business figures in UI copy or seeds — use `figure` placeholders or an explicit empty state until real data is wired.
- Never introduce a new colour, radius, shadow or font. If a design need is not covered by the tokens, stop and ask.
- No CSS gradients as decoration except the two documented atmosphere gradients and the logo leaf.
- Do not reproduce any car manufacturer's trade dress, model names, typefaces or page layouts. Patterns are fair game; brand assets are not.
- Every list view needs an empty, loading and error state before it is considered done.
- Money, dates and units are formatted through one shared locale utility, city-aware; NGN in minor units, ₦ prefix, no decimals in UI above ₦1,000.
- Write for a first-time owner: no unexplained jargon, no bare metric without a caption, no dead end without a next action.
