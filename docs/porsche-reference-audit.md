# Porsche Reference Audit

Companion to [`porsche-design-directive.md`](porsche-design-directive.md).
Findings from direct inspection of the live Porsche Taycan GTS site and
configurator (`porsche.com/international/models/taycan/taycan-models/taycan-gts/`
and the linked `configurator.porsche.com` flow, both browsed 2026-08-14,
desktop 1440×900 and mobile 375×812), plus the reference screenshots and
screen recording supplied by the product owner the same day (Taycan model
comparison grid, full configurator with equipment search/summary, lease/
retail financing estimator, overlay menu at desktop and mobile widths, Porsche
ID login page, and a screen recording of the marketing-site hero-to-model
flow). The recording's content is corroborated by the live site inspection
below rather than frame-extracted — no `ffmpeg` was available in this
environment to pull individual frames from it.

Every row below is Porsche pattern → why it works → how it should influence
HOC Elite Wheels → which HOC surface it affects. Nothing here authorizes
copying Porsche's marks, model names, copy, or proprietary imagery — see the
directive's originality requirement.

---

## Global navigation

**Porsche pattern.** A near-invisible header at rest (logo centred, "Menu"
text-link top-left, account/locale/wishlist icons top-right, no background
until scrolled), expanding into a two-column full-screen overlay: a left
column of top-level sections (Models, Electric, Shopping Tools, Porsche Shop,
Services, Experience, Find Your Porsche Center, Account pinned at the foot),
and a right column that swaps its content to a flat list of links for
whichever left item is focused/selected (e.g. selecting "Shopping Tools"
reveals Build Your Own / Compare Models / New & Used Inventory / Current
Vehicle Offers / Certified Pre-Owned & Warranty / Sell your Porsche / Porsche
Financial Services). Selected row gets a light-grey fill. No third "live
preview" pane at this viewport — HOC's build brief describes three panes,
Porsche's actual implementation runs two.

**Principle.** The chrome disappears until summoned, then the overlay itself
carries the entire wayfinding job in one uninterrupted read — no nested
flyouts, no accordions within the menu.

**HOC adaptation.** HOC's [`OverlayNav`](../apps/web/src/components/ui/overlay-nav.tsx)
already implements this two-pane swap mechanic almost exactly (primary list
left, secondary detail panel right, selected-row fill, focus trap, Escape,
staggered wipe) — this is a **KEEP**, already ahead of a literal reading of
the original build brief's three-pane spec. The one gap: Porsche's right
panel is a plain link list for utility sections but becomes richer (imagery,
metadata) for product sections like "Models" — HOC's vehicles panel already
does this (model thumbnails + category), which is correct; the configure and
process panels are currently link-list style, which is also correct since
they're not product catalogues.

**Applicability.** `SiteHeader` / `OverlayNav`, all milestones — this is the
one piece of chrome present on almost every screen, so any drift here is felt
everywhere.

## Hero

**Porsche pattern.** Full-viewport (~100svh) looped background video, the
model's script wordmark large and centred over it, an isolated side-profile
product shot composited on top of the video (not filmed as part of it), a
small category-tab row and model name/chip beneath, two stacked CTAs
("Change model variant" solid, "Configure" light), then a required legal
consumption/emissions line in small grey type. On mobile, the same stack
recomposes to full-width with the category tabs becoming horizontally
scrollable (a `>` affordance visible mid-row rather than wrapping).

**Principle.** Motion carries the emotional opening; the isolated product
shot immediately after keeps the vehicle legible and "real" rather than
letting it dissolve into the cinematic footage; the CTA pair commits to
exactly two next actions, no more.

**HOC adaptation.** This is very close to what HOC's homepage now does after
today's hero-video work: full `100svh` video, gradient scrim, script wordmark
(`Mr Dafoe`, centred), restrained two-CTA row, footnote-style disclosure line.
**KEEP** this structure. One real gap: Porsche's isolated product shot sits
*after* the video section as a distinct, separately-lit studio image (not
inside the video) — HOC's homepage now relies on the video alone for the
vehicle image and dropped the standalone product cutout entirely. Worth
re-introducing a short product-plate beat directly under the hero on the
homepage (not necessarily inside it) once real HOC vehicle photography exists,
rather than leaving the video as the only vehicle image on the page.

**Applicability.** Homepage hero (`apps/web/src/app/page.tsx`) — largely
already aligned; vehicle-detail hero should adopt the same video-then-product-
plate rhythm once video assets per model exist (currently image-only, see
Vehicle detail below).

## Vehicle presentation

**Porsche pattern.** Vehicles are never boxed. On the model grid, the same
soft-neutral plate recurs behind every isolated side-profile shot (screenshot
A); on detail pages the vehicle floats on a plain white floor with a soft
contact shadow, no borders, no rounded frame, no card chrome around the image
itself.

**Principle.** The product photography is the primary visual instrument —
UI chrome must never compete with it or contain it in a decorative box.

**HOC adaptation.** `VehicleCard` already uses a flat neutral plate
(`bg-surface`) with `object-contain`, no border, no rounded corners on the
image itself — **KEEP**. The homepage catalogue-preview and vehicle-detail
hero both already use `object-contain` with a drop-shadow instead of a boxed
frame — **KEEP**. This principle is one of the strongest matches already in
the codebase; protect it explicitly when touching these components later.

**Applicability.** `VehicleCard`, vehicle-detail hero, any future comparison
or configurator vehicle imagery.

## Vehicle detail

**Porsche pattern.** The page is long-form and rhythmic, not a single spec
dump: hero → spec block (count-up numerals with footnotes) → one focused
feature story with its own sub-narrative ("Overfeel" / E-Shift, with its own
short video and two supporting paragraphs) → a "Highlights" grid of five
*differently composed* cards (not identical tiles — text-only, image+text,
wheel close-up, interior shot, etc.) → an interactive audio hotspot ("Hold for
sound") tied to a real product feature (Porsche Electric Sport Sound) → a
tabbed technical section (Chassis / Engine and gearbox / Battery and
charging) that re-shows relevant spec numerals per tab → a battery-guarantee
trust block → a comparison teaser → cross-sell teasers (paint options,
personalisation) → a satisfaction-rating widget → the full legal footnote
block.

**Principle.** Spec data is never presented as a bare table — it's always
re-contextualised with a headline, a caption, and (where used) a hotspot or
tab that makes the number feel connected to a real, explainable feature.

**HOC adaptation.** HOC's current `/vehicles/[model]` page (see Design Gap
Audit) is a single hero + one plain 3-column "Pending" spec strip + one
CTA block — **MISSING** almost every rhythmic beat above: no feature story,
no highlights grid, no interactive module, no tabs, no comparison entry point,
no gallery. This is the single largest gap on the site relative to the
directive, though it's explainable: HOC has no confirmed per-model
specifications yet (deliberately, per the existing "pending HOC confirmation"
guardrail), so there's little to narrate. The *structure* (section rhythm,
tabs, highlights grid) can and should be built now with honest placeholder
content; the *content* (real feature copy, real specs) waits on HOC data —
do not fabricate it to fill the pattern.

**Applicability.** `/vehicles/[model]/page.tsx` — primary target for Milestone
6 per the directive's own milestone mapping ("commerce... draws heavily from
the configurator/summary hierarchy" also implies the product page feeding it
needs the same weight).

## Technical specifications

**Porsche pattern.** Large numerals (count-up on first viewport entry),
paired with a small caption underneath explaining exactly what's measured,
superscript footnote references resolving to a dense legal block at the page
foot, and the same numerals reappearing inside the relevant technical tab
(range/charging in the hero block, torque/power repeated under "Engine and
gearbox"). Never a bare number without a caption.

**Principle.** Big automotive numbers only build trust when their measurement
condition is one glance away — the footnote system is not legal
box-ticking, it's part of the credibility of the number itself.

**HOC adaptation.** HOC already has the right primitive
(`SpecBlock` + `Footnotes` + a working `useCountUp` hook with
`prefers-reduced-motion` handling) — **REFINE, not REPLACE**: the hook and
components exist but are currently unused on any real page (`/vehicles/[model]`
renders static "Pending" strings, not `SpecBlock`+`useCountUp` at all). Wire
the existing primitives into the vehicle-detail spec section now (even against
placeholder values, count-up can animate toward "Pending" being replaced
later) rather than building a new pattern.

**Applicability.** `/vehicles/[model]/page.tsx`, later `/o/[operator]` KPI
tiles could reuse the same count-up treatment for revenue/trips once live
telemetry exists (`KpiTile` currently renders static "—").

## Galleries

**Porsche pattern.** A thumbnail row beneath the primary configurator image
(front/side/rear/three-quarter/interior/detail views), click-to-swap the main
image, a fullscreen-expand icon, and an "Open 360° View" action as a distinct,
clearly-labelled control rather than implied by the thumbnails.

**Principle.** Users should never wonder whether more views exist — the
thumbnail row makes the full image set visible at a glance before they click.

**HOC adaptation.** **MISSING entirely.** HOC currently ships exactly one
image per vehicle, everywhere (grid, detail hero, configurator mix step).
Do not fake a gallery or a 360° control with a single image — per the
directive, show the normal single-image presentation honestly until multiple
angles per model actually exist, but architect the vehicle data shape
(`Vehicle.image`) to become `Vehicle.gallery: string[]` so the gallery
component can be dropped in without a data-model migration later.

**Applicability.** `/vehicles/[model]/page.tsx`, configurator media panel
(Milestone 6).

## Feature storytelling

**Porsche pattern.** Alternating composition — never five identical cards in
a row. A hero-weight feature (E-Shift) gets its own mini-page-within-the-page
with video; secondary features (exterior, wheels, interior) get a 2–3 column
grid where card *heights and image treatments differ*; the sound module
breaks pattern entirely as an interactive audio strip.

**Principle.** Visual rhythm is itself a signal of production quality — a
perfectly uniform card grid reads as templated, alternating composition reads
as edited.

**HOC adaptation.** **MISSING** on vehicle-detail; **partially present**
elsewhere — the homepage already alternates light/dark "rooms" and varies
section composition (hero → grid → dark operating-loop list → full-bleed
image-with-overlay-panel), which is the right instinct and should be the
model for what vehicle-detail needs. Extend that same alternating-composition
discipline into the vehicle page once there's real feature content to tell.

**Applicability.** `/vehicles/[model]/page.tsx`.

## Interactive modules

**Porsche pattern.** Used sparingly and always tied to a real feature — the
"Hold for sound" audio hotspot is the only genuinely interactive module on
the page beyond navigation/configuration; it's not decorative, it demonstrates
an actual product characteristic (Electric Sport Sound).

**Principle.** Interactivity is earned by having something real to
demonstrate — it is not a default page ingredient.

**HOC adaptation.** **MISSING, and should stay missing until there's a real
candidate.** HOC has no equivalent product characteristic yet to justify a
bespoke interactive module (no audio signature, no confirmed drive-mode
system). Don't manufacture one. Revisit once real vehicle data or a genuine
HOC-specific feature (e.g. live telemetry preview, a dispatch-map teaser on
the marketing site) exists.

**Applicability.** Speculative / future milestone, not Milestone 5–6.

## Model catalogue

**Porsche pattern.** Category tabs (Sport Saloon / Sport Turismo / Cross
Turismo) above a horizontally-arranged set of cards; each card carries an
isolated vehicle image on a neutral plate, model name, metadata pills (year,
powertrain, drivetrain, transmission), four spec rows with captions
(acceleration, power, top speed, range), a legal consumption caption, a
"Technical data and standard equipment" link, dual CTAs ("Explore in Detail"
solid + "Configure" light), and a "Compare" checkbox pinned at the card foot.
A left/right arrow pair scrolls the row; the row overflows visibly (screenshot
A shows a 4th card and a persistent chat-widget icon bleeding off the right
edge, confirming genuine horizontal scroll rather than a fixed grid).

**Principle.** The catalogue functions as a comparison surface from the first
glance, not just a browsing grid — the compare checkbox is present before the
user ever commits to a single model.

**HOC adaptation.** HOC's `/vehicles` page is currently a static 2-column
`sm:grid-cols-2` grid, single CTA (whole card is one link), no category
filter, no metadata pills, no compare affordance, no "From ₦X" pricing line —
**REPLACE** with a horizontally-composable catalogue once there's more than
one vehicle category to filter by (currently all 4 placeholder models lack
a real class distinction beyond a category string). Keep `VehicleCard`'s
existing plate/typography treatment (that part is **KEEP**); extend it with
metadata pills, dual CTA, and a compare checkbox rather than starting over.

**Applicability.** `/vehicles/page.tsx`, `VehicleCard`, ties directly into
the Comparison pattern below — build both together.

## Comparison

**Porsche pattern.** "Which Taycan is right for you?" teaser on every model
page → "Compare by: Performance Data / Standard Equipment" toggle changes
which rows the cards show → "Compare details" leads to a dedicated
multi-vehicle comparison surface with the same card format aligned
side-by-side, `Compare` checkboxes persisting selection across the catalogue.

**Principle.** Comparison is a first-class, always-reachable action, not a
buried utility — it's surfaced from both the catalogue and every vehicle
detail page.

**HOC adaptation.** **MISSING entirely** — no comparison flow, no `Compare`
affordance anywhere in the current build. This is explicitly called out in
the directive (items 8–9) as a pattern to build once the catalogue supports
it. Build alongside the catalogue rework above: persist selected slugs (URL
query, matching the existing configurator's URL-state convention already
established in `/configure/[step]`), a `/vehicles/compare` route with aligned
spec rows, continuing into detail/configure from there.

**Applicability.** New route `/vehicles/compare`, `/vehicles/page.tsx`,
`/vehicles/[model]/page.tsx` (teaser + entry point).

## Configurator

**Porsche pattern.** Two-column desktop layout: left = dominant vehicle
image with a thumbnail strip, camera icon, 360°-toggle icon, and a
fullscreen-expand icon; right = a scrollable panel starting with a search box
("Search equipment options"), then accordion-style option groups (Exterior
Colors expanded by default, showing sub-groups "Contrasts / Shades / Dreams /
Legends" each with its own price delta next to the group label and a swatch
grid beneath). A persistent top bar shows running price + "Summary" +
"Select a dealer" throughout, independent of which accordion section is open.
Selecting a colour instantly re-renders the main vehicle image in that colour
(confirmed live).

**Principle.** The vehicle visual and the running total are always on screen
regardless of which option group the user is currently deep in — configurator
depth never costs the user visual or commercial context.

**HOC adaptation.** This is the **largest structural gap on the entire
site**, and per the directive it's the pattern that matters most. HOC's
current `/configure/[step]` is a linear, six-page **GET-form wizard** — no
persistent vehicle image at all (not even the plain checkbox list shows
vehicle thumbnails), no colour/livery swatches (livery is two text radio
buttons), no accordion, no search, no live visual feedback of any kind,
`StickySummary` is text-only rows with no vehicle image. Functionally the
existing flow is genuinely good groundwork to preserve — **REFINE, not
REPLACE wholesale**: it's already resumable by URL, already guards against
inventing commercial data ("Package selection pending"), already has a
working step-rail. The Milestone 6 rebuild should keep that URL-resumable,
no-invented-data discipline while restructuring the *layout* to Porsche's
persistent-image + accordion-panel model, and restructuring *livery/mix*
selection from text radios into visual swatches once HOC supplies livery/
colour assets.

**Applicability.** `/configure/[step]/page.tsx`, `ConfigStepRail`,
`StickySummary`, `Field` (livery/mix become swatch grids, not radio labels) —
core of Milestone 6 per the directive's own mapping.

## Configuration summary

**Porsche pattern.** Two forms: (1) an in-flow sticky panel (running MSRP,
monthly payment placeholder, Base MSRP / equipment price / delivery fee
breakdown, "Fancy a test drive?" prompt, then a stack of actions — Select a
dealer / Explore Payment & Trade-In / Save / Create Porsche Code / Download
build PDF); (2) a dedicated review screen listing every selected option
grouped by category (Exterior Colors & Wheels / Interior Colors & Seats /
Exterior / Interior…) each with its own thumbnail, option code, price
("Standard Equipment" where included), and a "Change" link back into that
step.

**Principle.** The summary is never just a total — it's an itemised,
navigable record the user can audit and edit from, right up to the commerce
step.

**HOC adaptation.** `StickySummary` today is the right shape at a much
earlier stage (label/value rows, sticky) — **REFINE**: extend it toward the
itemised, thumbnail-per-line, "Change" affordance pattern once configuration
selections carry real option data (currently only city/size/vehicle-count/
"Pending" total). The review step in `/configure/[step]/page.tsx` already
does the grouped-rows version of this (`reviewRows` dl) — **KEEP** that
structure, extend with per-row "Change" links back to the relevant step (data
already supports this via query-string editing, just needs the UI links).

**Applicability.** `StickySummary`, `/configure/review`, later
`/orders/[id]` and the application/KYC handoff (Milestone 6).

## Pricing hierarchy

**Porsche pattern.** Base MSRP, price-for-equipment, delivery/processing fee,
and total shown as a clearly separated stack (not inline math), with the
total always the largest weight. A separate financing modal (Lease / Retail
Finance tabs) computes monthly payment from term/down-payment/FICO-band
inputs, shows a full breakdown (mileage, term, down payment, list price,
residual value → monthly payment), and carries a dense, explicit legal
disclaimer paragraph underneath every estimate ("this is not an offer... not
all applicants will qualify...").

**Principle.** Every number that isn't a firm commitment is labelled as an
estimate with a visible legal boundary right next to it — nothing implies
certainty it doesn't have.

**HOC adaptation.** HOC has no real pricing data yet (deliberately —
build-pack guardrail), so this pattern is **not yet buildable** beyond
structure. When HOC's package/deposit pricing is confirmed, adopt the same
separated-stack hierarchy (base / equipment / fees / total) and, if HOC ever
offers financing on the deposit or balance, the same estimate-with-disclaimer
pattern rather than a bare number. Until then, keep "Pending confirmation" as
the explicit placeholder exactly as the current build already does — this is
already correctly aligned with the principle, just with no data to hang it on
yet.

**Applicability.** `/configure/review`, `/orders/[id]` (Milestone 6–7).

## Option selectors

**Porsche pattern.** Visual swatches for anything visual (paint, wheels,
interior colour) — a grid of colour tiles with a price delta label above the
group, not a dropdown. Non-visual choices (term length, FICO band) use plain
segmented buttons.

**Principle.** Never make a user read a colour name from a dropdown when a
swatch shows it directly.

**HOC adaptation.** HOC's current livery/mix selectors are text-label radio/
checkbox rows (`Choice` component) — reasonable for vehicle *model* selection
(names matter more than a swatch there) but wrong for livery/colour once real
options exist — **REFINE**: keep `Choice` for model/package selection, add a
new swatch-grid primitive for colour/livery once HOC supplies real livery
options (currently only two placeholder concepts: "Operator identity" /
"Monochrome").

**Applicability.** `/configure/[step]` livery step, new `Swatch`/`ColorGrid`
primitive (Milestone 6).

## Mobile adaptations

**Porsche pattern.** Not a shrink — a recompose. Category tabs become
horizontally scrollable with a trailing chevron rather than wrapping; the
overlay menu's two columns become two full-height panels toggled by
selection rather than shown side-by-side (screenshot: mobile menu shows one
column at a time); CTA pairs go full-width stacked rather than staying
inline.

**Principle.** Every multi-column desktop pattern needs its own considered
mobile transformation, decided per-component, not a single global breakpoint
rule.

**HOC adaptation.** HOC's overlay nav already does real mobile recomposition
(stacked full-height sections instead of the desktop 3-column grid, confirmed
in earlier testing this session) — **KEEP**. The homepage hero already
verified correctly at 375×812 (today's work). The gap is downstream: the
*catalogue* and *configurator* reworks above need their mobile recomposition
designed alongside the desktop version, not bolted on after — call this out
explicitly in the Milestone 6 plan rather than treating mobile as a pass at
the end.

**Applicability.** All new Milestone 6 surfaces — design mobile composition
in the same pass as desktop, per the directive's own instruction (item 34).

## CTA hierarchy

**Porsche pattern.** Exactly one solid-primary CTA visible at a time per
decision point, paired with at most one lighter secondary — never three
competing buttons. Tertiary actions (Save, Create Code, Download PDF) are
visually quieter (outline/ghost) and grouped below the primary pair.

**Principle.** Hierarchy of *importance*, not just visual variety — the user
should never have to guess which button is the "real" next step.

**HOC adaptation.** HOC's `Button` variants (`solid` / `secondary` /
`outline` / `text` / `signal` / `glass`) already encode exactly this kind of
hierarchy, and current pages mostly respect it (one `signal` CTA per section)
— **KEEP** the token system. Worth a pass once Owner Space/commerce screens
exist to make sure tertiary actions (save/download-style) consistently use
`outline`/`text` rather than competing `signal` buttons creeping in.

**Applicability.** Ongoing discipline check at every milestone, not a
one-time fix.

## Motion

**Porsche pattern.** Subtle, purposeful: count-up numerals on first viewport
entry, crossfade on hover-driven preview panes, 360-380ms overlay wipes,
image swap on configurator option change is instant (no transition), page
scroll is native (no obvious smooth-scroll library engaged on the model
page itself). Nothing decorative or gratuitous.

**Principle.** Motion answers "what changed and why" — it is never present
just because a library is available.

**HOC adaptation.** HOC's existing motion tokens (`--duration-enter` 500ms,
`--duration-overlay` 380ms, `--duration-hover` 160ms, `--duration-count`
900ms, engineered easing curve) and `prefers-reduced-motion` handling across
`ScrollReveal`, `HeroVideo`, `LenisProvider`, and `useCountUp` are already
disciplined and match this principle closely — **KEEP** the whole system as
the standing motion contract for every future milestone.

**Applicability.** All milestones — this is already a strong, reusable
contract; extend it to new components rather than inventing new timing values.

## Commerce journey

**Porsche pattern.** Discover (hero) → Compare (catalogue + compare) →
Explore (detail) → Configure (configurator) → Summary → Financing estimate →
Dealer handoff. Porsche's journey terminates at a human dealer relationship —
it does not carry the user through an actual online purchase, account
creation, or fulfillment.

**Principle.** Porsche's job is to build desire and produce a fully-specified
configuration to hand to a dealer; it deliberately stops short of the
transaction itself.

**HOC adaptation.** This is the one place the directive is explicit that HOC
must go *further* than Porsche: Discover → Compare → Explore → Configure →
Apply → Verify (KYC) → Purchase → Provision → Operate, all inside one
product, one visual system. HOC's phased build (configurator today,
auth/KYC/application in Milestone 5, commerce in Milestone 6, provisioning in
Milestone 7, live operations after) already matches this shape structurally
— **KEEP** the phasing, and treat every hand-off point between phases
(configurator → account, account → application, application → order) as a
place where the Porsche-grade visual system must not drop, per directive
items 23–25.

**Applicability.** Cross-cutting — the throughline for the entire remaining
roadmap.
