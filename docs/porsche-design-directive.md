# Master Porsche Design Reference + E-Commerce Directive

**Status: ACTIVE STANDING DIRECTIVE.** In force for the entire remainder of the
HOC Elite Wheels project, Milestone 5 through production launch. This
overrides any weaker or more generic UI/UX guidance elsewhere in the
implementation plan. Do not treat this as satisfied once Milestone 5 ships —
re-read it before designing any new customer-facing surface at any milestone.

Origin: pasted in full by the product owner on 2026-08-14, alongside a set of
reference screenshots and a screen recording of the Porsche Taycan GTS site.
See [`porsche-reference-audit.md`](porsche-reference-audit.md) for the
pattern-by-pattern study this directive requires, and
[`design-gap-audit.md`](design-gap-audit.md) for how the current HOC Elite
Wheels implementation measures up against it.

---

## Critical design reference

The principal external design and interaction reference for HOC Elite Wheels
is: `https://www.porsche.com/international/models/taycan/taycan-models/taycan-gts/`

Study it deeply — not only the landing section. Go section by section,
interaction by interaction, page by page, feature by feature, including pages
reached from: model exploration, technical detail, model comparison,
configuration, colour selection, equipment selection, vehicle imagery,
galleries, pricing/summary interfaces, mobile responsive states, menus,
sticky navigation, calls to action, content storytelling, interactive feature
modules.

**The purpose is not a pixel-for-pixel Porsche clone**, and not to copy
Porsche branding, proprietary media, copywriting, logos, or distinctive
assets. The purpose is to understand and adapt its design language,
interaction hierarchy, commerce logic, information architecture, spatial
discipline, automotive presentation, and progressive product-discovery
patterns into an **original** HOC Elite Wheels experience. HOC Elite Wheels
must remain its own product and brand.

## Core instruction

From Milestone 5 onward, whenever a screen, route, component, modal,
workflow, commerce interaction, or feature is built that doesn't yet have a
completed approved design:

1. **First** — inspect how the Porsche Taycan digital experience handles an
   equivalent or closely related problem.
2. **Then** — translate the strongest applicable interaction principles into
   HOC Elite Wheels.
3. **Do not** fall back immediately to generic SaaS dashboards,
   Bootstrap-looking cards, ordinary admin templates, generic Tailwind
   dashboards, generic ecommerce grids, stock checkout layouts, or enterprise
   CRM aesthetics — if Porsche has a more refined automotive pattern for the
   same interaction, use that as the creative benchmark.

## HOC Elite Wheels is an e-commerce platform

Not merely an EV marketing site, a fleet-management dashboard, an admin
application, or a dispatch platform — it is also a high-value automotive
commerce platform. The customer journey connects:

```
Discover → Compare → Explore → Configure → Apply → Verify → Purchase → Provision → Operate
```

It must feel continuous. Users must never feel they've left a premium
automotive site and landed in an unrelated SaaS system when they start
configuring or purchasing. Commerce functionality inherits the same premium
design system as the storefront.

## Porsche patterns that must be studied

1. **Immersive vehicle hero** — large-format presentation, imagery/video,
   spacious composition, minimal competing chrome, restrained CTAs, strong
   hierarchy. The vehicle is the product — don't box it in.
2. **Product storytelling** — not just a spec table. Large visual sections,
   feature stories, technical info, interactive modules, imagery, moving
   through exterior/interior/EV tech/fleet suitability/charging/safety/
   comfort/operational capability/technology/storage/ownership. Never invent
   specifications — unavailable data reads "Pending HOC confirmation."
3. **Feature story sections** — strong visual + short headline + focused
   copy + interactive exploration. Vary composition; avoid endless identical
   cards.
4. **Technical feature tabs** — restrained tabbed/segmented interfaces for
   switching between performance, battery, charging, dimensions, equipment,
   ownership, fleet characteristics.
5. **Interactive hotspot experience** — optional, only where it communicates
   real product information (exterior details, wheels, lighting, charging
   port, interior, storage, technology). Never a gimmick for its own sake.
6. **Vehicle variant carousel** — a horizontally explorable catalogue.
   Isolated vehicle image, model name, year (where confirmed), powertrain,
   drivetrain, transmission, core specs, availability, price (where
   confirmed), technical detail link, configure CTA, comparison selector.
   Real HOC data only.
7. **Category/body-type switching** — segmented category filter (Porsche:
   Sport Saloon / Sport Turismo / Cross Turismo → HOC: e.g. Saloon / SUV /
   Crossover / Executive / Commercial). Only expose categories backed by
   actual inventory.
8. **Performance vs. equipment comparison** — ability to change comparison
   context (specs, equipment, charging, capacity, dimensions, fleet
   suitability, commercial info). Never fabricate data to fill a table.
9. **Vehicle comparison flow** — select multiple → compare → aligned specs →
   meaningful differences → continue into detail → configure. Persist
   comparison state appropriately; side-by-side on desktop, usable
   horizontal/progressive comparison on mobile.
10. **Configurator** — should become one of the strongest experiences on the
    platform. Desktop: large vehicle visual (angle switching, gallery,
    thumbnails, optional 360°) on one side; scrollable configuration panel
    (model, fleet quantity, exterior colour, wheels, interior, equipment,
    package, operating city, livery, commercial package) on the other. Only
    include sections meaningful to HOC's business.
11. **Sticky commerce summary** — persistent awareness of current selection:
    quantity, base amount, additions, total, deposit, financing (only if HOC
    supports it — never invent figures). Actions like Save / Summary /
    Continue / Apply / Reserve / Checkout depending on stage.
12. **Live configuration feedback** — every change updates the experience
    immediately (colour → visual, package → summary, quantity → commercial
    summary, model → available options).
13. **Visual option swatches** — visual selectors for visual choices
    (colours, livery, wheels, interior, trims), not dropdowns for everything.
14. **Option grouping** — logical grouping (Exterior: colour/wheels/package;
    Interior: colour/seating/trim; Fleet: quantity/city/livery/package;
    Operational: charging/driver requirements/service package). Don't expose
    options the business doesn't offer.
15. **Accordion configuration** — clean expandable sections once
    configuration depth grows, showing current selection, alternatives,
    price impact, completion state without overwhelming.
16. **Configuration search** — if the catalogue grows large, a search
    mechanism over real available options.
17. **Thumbnail vehicle gallery** — front/side/rear/three-quarter/interior/
    cockpit/storage/charging views, where HOC has the assets.
18. **360° view** — architect the media layer so a future 360° viewer is
    supportable; never fake it with static imagery in the meantime.
19. **Fullscreen vehicle view** — enlarge imagery, minimal chrome, keyboard
    escape, mobile-correct, accessible.
20. **Save configuration** — authenticated configs persisted server-side, not
    only localStorage. Configure → save → leave → return → continue.
21. **Shareable configuration** — architect for a stable configuration
    identifier (concept only, e.g. `HEW-XXXXXX` — naming not yet approved).
22. **Commerce summary page** — before application/payment: model, imagery,
    quantity, configuration, package, city, pricing, deposit, documents,
    next step. Avoid conventional checkout clutter.
23. **Vehicle detail → configuration** — explore → compare → configure
    without losing context; configuration auto-carries the selected model.
24. **Configuration → application** — account/auth must preserve the
    configuration; never make the customer rebuild the fleet after signing
    up.
25. **Application → purchase** — approved application → order → payment →
    provisioning must continue visually from the configurator, not drop into
    a crude admin form.
26. **Price presentation** — clear base price, option impact, total, deposit,
    payment state. No fake discounts, countdown timers, loud sales badges,
    unnecessary promotional colour. This is premium high-value commerce.
27. **Product cards** — vehicle first, box second. Not generic ecommerce
    tiles.
28. **Spatial design** — large whitespace, strong grids, clear grouping,
    intentional alignment, fewer competing borders/shadows, large media,
    concise typography. When in doubt, favour space over another element.
29. **Panels** — only where they improve hierarchy. Avoid card-inside-card-
    inside-card.
30. **Radius** — restrained, consistent with the existing token contract. No
    bubbly consumer-app styling.
31. **Motion** — reinforces hierarchy, navigation, discovery, configuration,
    state changes: subtle reveals, smooth image transitions, polished panel
    movement, controlled overlays, gentle carousels, purposeful configurator
    transitions. Never motion just because a library exists.
32. **Sticky UI** — pricing, summary, configurator progress, model identity,
    key action. Must not suffocate mobile screens.
33. **Menu system** — continue the established premium overlay navigation.
    The HOC Elite Wheels wordmark keeps its script treatment everywhere the
    brand appears as a visual signature; ordinary navigation stays Inter.
34. **Mobile experience** — do not just shrink desktop. Recompose (e.g. the
    desktop configurator's left/right split becomes vehicle visual → sticky
    summary → configuration options on mobile).
35. **Owner Space** — same principles (precision, hierarchy, calm surfaces,
    large important data, restrained colour), but Owner Space is operational,
    not marketing — don't copy the public vehicle page literally into the
    dashboard.
36. **Fleet page** — vehicles feel automotive and recognisable (image, model,
    registration, driver, state, charging/energy, next maintenance,
    location) rather than abstract database rows, where space allows.
37. **Owner vehicle detail** — borrows the product-page philosophy: identity
    (large visual), operational state, real telemetry only, maintenance,
    energy, documents, history. The owner manages a vehicle, not a database
    record.
38. **HOC Console** — allowed to be denser (internal tool), but still follows
    the same typography/spacing/controls/monochrome/Guards-Red/brand
    hierarchy. No generic admin dashboard theme.
39. **Design review before implementing new surfaces** — before coding, ask:
    (1) Does Porsche have an equivalent public-facing interaction? (2) Can
    its design principle improve HOC Elite Wheels? (3) How should that
    principle change because HOC is also a fleet and commerce platform? (4)
    What information does HOC actually possess? (5) What should stay pending
    rather than be fabricated? Then implement.

## Screenshots supplied by the user (2026-08-14)

**Screenshot A — Porsche vehicle comparison/catalogue cards**: isolated
side-profile vehicle presentation, large soft-neutral product plates,
category tabs (Sport Saloon / Sport Turismo / Cross Turismo), performance/
equipment comparison-mode toggle, technical spec hierarchy, model metadata
pills (year, drivetrain, transmission), horizontally browsable lineup,
"Explore in Detail" / "Configure" / "Compare" actions.

**Screenshot B — Porsche Taycan configurator**: dominant vehicle visual,
two-column desktop composition, vehicle thumbnails, fullscreen/expanded
visual, optional 360° view, sticky commercial summary, searchable equipment/
options, grouped configuration categories, visual colour swatches, price
impact beside option groups, configuration summary, clear final commerce CTA.

**Screenshot recording** — a screen capture of the live Porsche marketing
site's hero-to-model-selection flow: full-viewport hero video, minimal
floating navigation, restrained text/CTA overlay, leading into a model
selection experience. Treat these as additional reference when live browser
inspection misses dynamic/gated UI (region pricing, login walls, etc.).

Treat all of the above as reference only — never lift Porsche photography,
video, product renders, logos, wordmark, model names, marketing copy, icons,
or proprietary configurator graphics for HOC production use.

## Media quality

Use supplied HOC assets, properly licensed assets, or original generated
assets approved for the project. Porsche media is reference only, never
production material.

## Originality requirement

The finished product must never create confusion that HOC Elite Wheels is
Porsche. Reproduce the quality bar and UX principles — not the marks, names,
copy, or proprietary visuals.

## Commerce + operations continuity

The most important HOC-specific addition is everything after configuration —
Porsche's experience leads toward a purchase; HOC Elite Wheels continues much
further:

```
Vehicle Discovery → Comparison → Fleet Configuration → Account → KYC →
Application → Approval → Contract → Deposit → Balance → Vehicle Allocation →
Owner Space → Driver Assignment → Live Dispatch → Trips → Earnings →
Maintenance → Reporting
```

The visual system must make this feel like one platform, not twelve
disconnected apps.

## Milestone-specific application

- **Milestone 5 (auth/onboarding)** — premium minimalism, progressive
  disclosure. Never feel like a generic government form.
- **Milestone 6 (commerce)** — draws heavily from the configurator/summary
  hierarchy: vehicle visualisation, price hierarchy, option summary,
  persistent next actions.
- **Milestone 7 (vehicle provisioning)** — vehicle-first presentation over
  inventory-table-first, where possible.
- **Milestone 8 (driver management & Owner Space)** — retain the visual
  system, prioritise speed and clarity.
- **Milestone 9 (dispatch, GPS, ride flows)** — the premium dark
  operational environment already established; don't force public-page
  styling onto a live control surface.
- **Milestone 10 (fleet intelligence dashboard — earnings, battery/vehicle
  health, maintenance, unified)** — translate the precision, not the
  product-page composition; vehicle-specific views stay automotive and
  visual. Combines what were previously separate "earnings" and
  "maintenance/energy" milestones into one cohesive dashboard, per the
  strategic MVP enhancement decision.
- **Milestone 11 (marketplace lease flow)** — draws from the same
  configurator/summary hierarchy as Milestone 6's buy flow; a lease vs.
  buy toggle is a first-class choice, not a buried option.
- **Milestone 12 (HOC Console)** — dense information is fine; generic
  admin-template styling is not.
- **Milestones 13–20** — same system throughout. Any new customer-facing
  screen is considered against the Porsche reference before designing from
  scratch.

## Guardrails

- **Never reduce functionality for visual similarity.** Multi-tenancy, RLS,
  fleet management, organizations, KYC, applications, HOC approval, live
  dispatch, drivers, trips, earnings, maintenance, energy, reporting, HOC
  administration — none of this is ever removed or weakened just to look more
  like Porsche. Function wins first, then the best relevant presentation
  pattern.
- **Don't over-Porsche the product.** Not every screen needs a giant car, an
  enormous video, or a horizontal slider. The target is Porsche-grade
  automotive product experience + HOC-specific fleet commerce +
  enterprise-grade operational capability — not imitation.
- **Do not rebuild good existing work solely for similarity.** Audit first;
  protect working architecture and data flows; only REFINE/REPLACE what the
  gap audit actually finds wanting.

## The quality test

Before marking any customer-facing page finished, ask:

1. If this page appeared between two pages of the Porsche Taycan digital
   experience, would the quality suddenly feel dramatically cheaper? If yes —
   refine it.
2. Does this still clearly feel like HOC Elite Wheels rather than a Porsche
   copy? If no — make it more original.

Both conditions must be satisfied.

## Final design target

The finished product should feel like the digital experience of a serious
premium automotive company that also happens to operate a sophisticated
commerce, fleet, and dispatch platform. The visual journey moves naturally
from emotion → product → configuration → transaction → ownership →
operation without losing quality. Porsche is the benchmark for the first
three; HOC Elite Wheels must extend that quality into the last three.
