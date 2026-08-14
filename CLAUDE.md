# HOC Elite Wheels

Multi-tenant EV ride-dealership platform. pnpm/Turborepo monorepo:
`apps/web` (Next.js App Router storefront + owner space + admin, per
[`docs/HOC-Connect-architecture-and-schema.md`](docs/HOC-Connect-architecture-and-schema.md)),
`apps/driver` (Expo), `packages/*` (design-tokens, db, contracts,
integrations, config).

## Standing design directive — read before building any customer-facing surface

**[`docs/porsche-design-directive.md`](docs/porsche-design-directive.md) is an
active standing directive, in force from Milestone 5 through production
launch.** It is not a one-time task — re-consult it before designing any new
screen, route, component, modal, workflow, or commerce interaction, for the
entire remainder of the project. It overrides any weaker/more generic UI/UX
instinct (generic SaaS dashboards, stock ecommerce grids, admin-template
styling).

Companion docs, read alongside it:
- [`docs/porsche-reference-audit.md`](docs/porsche-reference-audit.md) — the
  pattern-by-pattern study of the Porsche Taycan GTS site/configurator this
  directive requires, already done.
- [`docs/design-gap-audit.md`](docs/design-gap-audit.md) — KEEP / REFINE /
  REPLACE / MISSING classification of every current HOC page/component
  against those patterns. **Do not rebuild anything marked KEEP for
  similarity's sake** — the two structural gaps that actually need work are
  the vehicle catalogue/comparison surface and the configurator's visual
  layer (both Milestone 6).

The target is Porsche-grade interaction quality adapted into HOC's own brand
— never a Porsche clone, never Porsche marks/copy/photography/model names in
production.

## Locked brand/design constraints

Porsche monochrome `light-dark()` colour system (see
`packages/design-tokens`); Guards Red `#D5001C` as the only signal colour;
Inter (400/600/700) as the shipping typeface; `Mr Dafoe` reserved solely for
the `BrandWordmark` component wherever "HOC Elite Wheels" appears as a visual
signature (header, overlay nav, footer, loader) — never elsewhere, never for
operational UI. The gold HOC logo (`BrandMark`) is used as-is, unedited, as
the only ornament — never a gold UI theme.

## Stack (locked)

Next.js App Router + TypeScript + Tailwind; Supabase (Postgres, Auth, RLS,
Realtime, PostGIS); tRPC + Drizzle; Paystack (not Stripe); Prembly for KYC;
Mapbox for live map/dispatch.

## Guardrails

Never invent business facts, prices, specs, or figures in UI copy or seed
data — use explicit "pending confirmation" language instead. Ask before
adding brand copy that asserts facts about HOC.
