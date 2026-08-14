# Milestone 04 — Public storefront and configurator

Status: complete; awaiting approval before Milestone 05.

## Included

- Production public shell using the supplied HOC logo as the sole gold ornament.
- Light-room public design with explicit monochrome tokens, hairline structure, flat image plates, and Guards Red reserved for primary signal actions.
- Three-pane animated navigation on desktop and a focused two-level composition on mobile.
- Focus containment, Escape dismissal, focus return, reduced-motion support, and responsive overflow handling.
- Production homepage at `/` with a centred layered vehicle hero, catalogue preview, four-stage operating loop, and editorial fleet plate.
- Catalogue at `/vehicles` using four supplied studio images.
- Statically generated vehicle detail routes at `/vehicles/model-01` through `/vehicles/model-04`.
- Process page at `/how-it-works` covering Discover, Configure & apply, Approve & provision, and Operate & earn.
- Six-step deep-linkable configurator at `/configure/[step]`:
  1. City
  2. Fleet size
  3. Vehicle mix
  4. Livery
  5. Package
  6. Review
- GET-based progressive enhancement that preserves configuration state in the URL and carries a selected vehicle from its detail page.
- Supplied studio and urban imagery copied into stable application asset paths without editing the source files.

## Claim and data guardrails

- Catalogue model names are neutral placeholders: Model 01–04.
- Range, battery, seating, price, availability, package content, and estimated totals remain visibly pending HOC confirmation.
- City entry captures a proposed market and never asserts current market availability.
- The review screen stops before authentication, KYC, application submission, and payment rather than simulating those actions.
- No Stripe dependency, wording, or flow was introduced.

## Verification

- `pnpm --filter @hoc/web typecheck`
- `pnpm --filter @hoc/web lint`
- `pnpm --filter @hoc/web build`
- Browser route audit for `/`, `/vehicles`, and `/vehicles/model-02`
- Full browser interaction audit from `/configure/city` to `/configure/review`
- Desktop and 390 px mobile viewport checks
- Navigation focus trap, Escape dismissal, and focus-return check
- Runtime console and framework-overlay check

The web build passes, all audited routes render meaningful content, the checked pages have no horizontal viewport overflow, and the final audit reports no console warnings or errors.

## Deferred to Milestone 05

Supabase Auth, Prembly KYC, saved applications, tenant-aware owner onboarding, orders, Paystack deposit/balance payments, and verified catalogue/commercial data are intentionally deferred to the next approved milestone.

## Porsche reference refinement

The milestone was reworked after reviewing the supplied Porsche menu recording, screenshot, and the live Taycan GTS page.

- Replaced the equal-weight editorial overlay with a full-viewport navigation system: quiet primary hierarchy, scrollable secondary model rail, and a dark atmospheric remainder.
- Replaced oversized menu display type with restrained utility-scale labels and selected-row surfaces.
- Added primary-to-secondary menu switching without routing away from the overlay.
- Replaced the text close action with a floating circular close control while preserving focus containment, Escape dismissal, and focus return.
- Rebuilt the homepage and vehicle-detail heroes as layered product stages with an atmospheric upper field, isolated vehicle, and calm centered information.
- Replaced destructive `object-cover` vehicle crops with `object-contain` product presentation.
- Raised product-image delivery quality to 90 in the Next.js image configuration.
- Added an explicit Lenis opt-out, native overflow containment, keyboard focus, and a subtle scrollbar to the secondary menu rail. A real wheel gesture moved the 720 px rail through its complete 524 px scroll range.
- Isolated the full-screen menu in its own light colour room so the inverse homepage header cannot cascade white text into the light navigation panels.
- Anchored the desktop panes to the fixed overlay height instead of dynamic viewport units. At the 1440 × 900 verification size, the 900 px model rail scrolled through its complete 443 px overflow range.
- Reworked the homepage header as a dark translucent overlay with menu control at left, the approved `HOC CONNECT` name centred, and the supplied gold emblem unchanged at right.
- Added the `Mr Dafoe` display face through `next/font` for the user-requested slanted centre wordmark; Inter remains the shipping typeface everywhere else.
- Replaced the low-resolution hero atmosphere photo with resolution-independent monochrome gradients, while preserving the supplied photography elsewhere.
- Added a dedicated side-profile hero car with separate broad floor and tight tyre-contact shadows so the vehicle crosses the dark/light boundary without appearing to float.

### Refined vehicle assets

The built-in image generation workflow was used in edit mode, followed by local chroma-key removal and alpha validation. The original supplied files remain unchanged.

- `apps/web/public/vehicles/cutouts/model-01-v2.png`
- `apps/web/public/vehicles/cutouts/model-02-v2.png`
- `apps/web/public/vehicles/cutouts/model-03-v2.png`
- `apps/web/public/vehicles/cutouts/model-04-v2.png`

Each source prompt identified its supplied image as the edit target, preserved its existing generic body style, colour, viewpoint, proportions, glasshouse, wheels, and major geometry, requested correction of soft AI artefacts, and prohibited logos, badges, text, people, props, shadows, and extra objects. A uniform `#00ff00` field was requested for local background extraction. Final images are approximately 1672 × 941 with alpha and validated transparent corners.

### Dedicated homepage hero asset

The built-in image generation workflow was also used in generate mode for a single original, unbranded side-profile saloon. The final project asset is:

- `apps/web/public/vehicles/hero-saloon-side-v1.png` — 1881 × 836 with alpha.

Final prompt summary: a high-definition, original luxury electric grand-touring saloon in deep graphite metallic; exact side profile facing right; full vehicle and wheels visible; transparent background; controlled premium studio lighting; no floor or baked shadow; no logos, badges, text, manufacturer signatures, people, extra vehicles, or scenery. Grounding shadows are intentionally rendered in CSS rather than baked into the image.
