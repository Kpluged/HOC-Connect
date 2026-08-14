# Milestone 03 — Foundation system

Status: complete; awaiting approval before Milestone 04.

## Included

- pnpm/Turborepo workspace with `apps/web`, `apps/driver`, and shared contracts, database, design-token, and integration packages.
- Next.js 16 App Router web shell and Expo 57 driver shell.
- Shared Porsche-grade monochrome token contract using CSS `light-dark()`.
- Guards Red `#D5001C` limited to explicit signal/live variants; blue limited to the keyboard focus ring.
- Inter 400/600/700 on web and native.
- Supplied HOC mark copied without alteration for the web header, loader, favicon, and driver shell/splash.
- Lenis provider, reduced-motion rules, entry/overlay motion timings, and a viewport-aware `useCountUp` hook.
- Token-only web primitives: Button, Explainer, Chip, SpecBlock, Field, OverlayNav, VehicleCard, ConfigStepRail, StickySummary, KpiTile, DataTable, StatusDot, MapPanel, Footnotes, SectionHeader, and SignalLine.
- `/styleguide`, with the primitives rendered in declared light and dark rooms.

All sample text on the milestone routes is an implementation label or an explicit pending-data state. No public HOC claim was introduced.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Expo static web export from `apps/driver`

All four checks pass.

## Deferred to Milestone 04

The production storefront shell, overlay content model, supplied vehicle photography, catalogue, vehicle detail route, and configurator are intentionally not started until this foundation is approved.
