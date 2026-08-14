# Design Gap Audit

Companion to [`porsche-design-directive.md`](porsche-design-directive.md) and
[`porsche-reference-audit.md`](porsche-reference-audit.md). Classifies every
currently-implemented HOC Elite Wheels page and primitive (as of the
Milestone 4 storefront + hero-video refinement, 2026-08-14) against the
Porsche-derived principles.

```
KEEP     — already meets the quality target, do not touch for similarity's sake
REFINE   — correct feature, interaction/design can be improved
REPLACE  — existing approach is too generic and should be rebuilt
MISSING  — a useful commerce/product interaction does not exist yet
```

This audit exists to **protect working architecture**, not to justify
rebuilding it. Nothing here should be read as a mandate to touch a KEEP item.
Where a REPLACE or MISSING item depends on data HOC hasn't confirmed yet
(model specs, pricing, livery options), that's noted — the fix there is
providing data, not more UI work.

---

## Global chrome

| Item | Verdict | Why |
|---|---|---|
| `SiteHeader` (overlay + default variants) | **KEEP** | Matches Porsche's near-invisible-at-rest header + overlay-summoned nav almost exactly. |
| `OverlayNav` (two-pane swap, focus trap, Escape, stagger) | **KEEP** | Already implements the two-column overlay mechanic Porsche uses; ahead of the original three-pane build-brief spec. |
| `BrandWordmark` / `BrandLockup` / `BrandMark` | **KEEP** | Script wordmark applied consistently everywhere the brand appears (header, overlay footer, footer, loader) — the exact bug this session was asked to check for is already fixed. |
| `MarketingFooter` | **KEEP** | Restrained, correct information (nav links + one disclosure line). No changes indicated by the reference audit. |
| `Button` variants (`solid`/`secondary`/`outline`/`text`/`signal`/`glass`) | **KEEP** | Encodes real CTA hierarchy already; revisit only as a discipline check when new screens are added, not a rebuild. |
| `loading.tsx` | **KEEP** | Matches the directed loader placement (brand mark, centred, full-bleed canvas). |

## Homepage (`/`)

| Item | Verdict | Why |
|---|---|---|
| Hero (`HeroVideo`, gradient scrim, wordmark, headline, dual CTA) | **KEEP** | Rebuilt this session specifically to match the Porsche full-viewport-video-hero pattern; verified desktop + mobile. |
| Catalogue preview grid | **REFINE** | Correct instinct (four cards, "View all"), but inherits the catalogue-card gaps below (no metadata pills, no dual CTA, no compare). Fix once `/vehicles` is reworked — don't fork a separate treatment for the homepage preview. |
| "Operating loop" dark section | **KEEP** | Good alternating-room composition; matches the storytelling-rhythm principle already. |
| Full-bleed image + overlay panel section | **KEEP** | Already a distinct composition from the grid above it — exactly the "vary composition" principle. |

## Vehicle catalogue (`/vehicles`)

| Item | Verdict | Why |
|---|---|---|
| Overall layout (static 2-col grid, single CTA per card) | **REPLACE** | See Reference Audit → *Model catalogue*. No category filter, no metadata pills, no dual CTA, no compare checkbox, no horizontal-scroll affordance. This is the biggest gap on the public storefront after the configurator. |
| `VehicleCard` image treatment (neutral plate, `object-contain`, no border) | **KEEP** | Matches Porsche's "vehicle never boxed" principle exactly — preserve this when extending the card with pills/CTAs. |
| Catalogue data model (`Vehicle` type: single `image`, `specs: null`) | **MISSING fields** | Needs `gallery: string[]`, a real `class`/category field distinct from the free-text `category` string, and eventually confirmed specs — a data-model task, not a visual one. Don't invent values to fill it. |

## Vehicle detail (`/vehicles/[model]`)

| Item | Verdict | Why |
|---|---|---|
| Hero (single image, eyebrow, headline, one CTA) | **REFINE** | Structurally sound (matches HOC's own layered-hero language) but stops after one screen — no follow-through into the storytelling rhythm below. |
| Spec section (3-column static "Pending" strip) | **REPLACE** | See Reference Audit → *Technical specifications*. `SpecBlock` + `Footnotes` + `useCountUp` already exist and are unused here — wire them in rather than building new. |
| Feature storytelling (highlights grid, hotspot, tabs) | **MISSING** | No equivalent exists at all. Correctly deferred — needs real HOC feature content, not fabricated copy. |
| Gallery / thumbnails / fullscreen / 360° | **MISSING** | Single image only, everywhere. Architect `gallery: string[]` now; don't fake a gallery control with one image. |
| Comparison entry point | **MISSING** | No "Which model is right for you?" teaser or compare affordance. Build alongside the catalogue rework. |
| Sticky in-page nav | **REFINE** | One "Specifications" anchor link exists in the sticky bar; Porsche's richer sticky in-page nav (Overview/Range/Charging/Interior/Package-style anchors) only makes sense once there's more than one section to jump to — expand as the feature-storytelling sections above are built, not before. |

## Configurator (`/configure/[step]`)

| Item | Verdict | Why |
|---|---|---|
| Overall structure (6-step, URL-resumable, GET-form) | **REFINE, not REPLACE** | See Reference Audit → *Configurator*. The URL-resumability, no-invented-data discipline, and step-rail are genuinely good and worth preserving through the rebuild — this is the one area where "REFINE" specifically means "restructure the layout, keep the underlying data flow." |
| Persistent vehicle visual | **MISSING** | No vehicle image shown at any step except the mix step's checkbox list (name/category text only, no thumbnail). This is the single largest structural gap versus the directive's own priority ranking ("the configurator should become one of the strongest experiences on the platform"). |
| Livery/colour selection (`Choice` text radios) | **REFINE** | Fine for model/package selection (names matter more than swatches); wrong long-term for livery/colour — needs a swatch-grid primitive once real livery options exist. |
| `ConfigStepRail` | **KEEP** | Clear, numbered, responsive (horizontal scroll on mobile via `overflow-x-auto`) — no changes indicated. |
| `StickySummary` | **REFINE** | Right shape (sticky, label/value rows) at an earlier stage than Porsche's itemised per-line-with-thumbnail version; extend, don't discard, once configuration selections carry real option data. |
| Review step (`reviewRows` dl) | **KEEP structure, REFINE affordance** | Grouped review rows already match Porsche's summary-page shape; add per-row "Change" links back to the relevant step (data already supports this via the existing query-string editing pattern). |
| Search over options | **MISSING** | Not yet relevant — HOC's option set is currently tiny (6 steps, ≤2 choices per step). Revisit only once the equipment/option list actually grows large enough to need search, per the directive's own conditional framing ("if HOC's catalogue eventually contains many equipment/options"). |

## How it works (`/how-it-works`)

| Item | Verdict | Why |
|---|---|---|
| Numbered-stage editorial layout | **KEEP** | Generous typography, large numerals, alternating structure — already close to Porsche's storytelling rhythm; no gap identified. |

## Styleguide (`/styleguide`)

| Item | Verdict | Why |
|---|---|---|
| Internal component tour | **KEEP** | Purely internal reference, not a public surface — not in scope for Porsche-pattern comparison. Keep it up to date as new primitives are added (e.g. once a `Swatch`/`ColorGrid` primitive exists, add it here). |

## Cross-cutting primitives not yet exercised by any page

| Item | Verdict | Why |
|---|---|---|
| `KpiTile`, `DataTable`, `MapPanel`, `StatusDot`, `SignalLine` | **KEEP (unbuilt surfaces)** | Well-formed primitives built ahead of need for Owner Space / Console (Milestones 8–12). No verdict on visual quality yet since no real page uses them — re-audit once Owner Space ships. |
| `Explainer` | **KEEP (unused)** | Matches the directive's "plain-English definition on first use" requirement from the original build pack; not yet used on any live page because no page currently has jargon dense enough to need it. Apply as KYC/application copy (Milestone 5) introduces operational terms. |

## Summary

The **storefront chrome (header, nav, brand, footer, motion contract) is
strong and should not be touched for similarity's sake** — it already
reflects the Porsche principles closely, in some respects ahead of the
original build brief. The **two real structural gaps are the vehicle
catalogue/comparison surface and the configurator's visual layer** — both
flagged **REPLACE**/**MISSING** above, both squarely Milestone 6 work per the
directive's own milestone mapping, and both blocked in part on real HOC
vehicle data (models, specs, livery options) rather than on design effort
alone. Vehicle-detail storytelling is the third gap but is correctly
sequenced behind the catalogue/configurator work and behind real feature
content existing to tell.
