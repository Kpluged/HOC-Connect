# Milestone 09a — Dispatch, trips, telemetry & the live map (web + server)

Status: complete; the Expo driver app, live GPS broadcast, bearer auth, and
Sentry are the separate **M9b** slice (see "Deferred" below).

The operations domain the architecture doc
([`HOC-Connect-architecture-and-schema.md`](HOC-Connect-architecture-and-schema.md)
§4, §6, §9) always described, and everything Milestone 8 explicitly deferred to
M9: real trips with a validated lifecycle, PostGIS, tenant-scoped
nearest-driver matching, a monochrome Mapbox live map, and the Owner Space
dispatch / energy / maintenance surfaces.

## Included

- **PostGIS** enabled into a dedicated `gis` schema (migration `0019`, no
  version pin — Supabase deprecated pinning). `packages/db/src/schema/_shared.ts`
  gains a `geographyPoint` custom type (`gis.geography(Point,4326)`) and a
  `moneyMinor` helper.
- **Operations tables** (`packages/db/src/schema/operations.ts`, migration
  `0020`): `trips`, `trip_events` (bigint identity, append-only),
  `vehicle_telemetry_snapshots` (one row/vehicle), `charging_sessions`,
  `maintenance_tickets`, with GiST indexes on every geography column plus the
  partial "available drivers" index. `drivers` gains three additive dispatch
  columns (`operational_status`, `current_location`, `last_seen_at`) — the
  M8 vetting `status` is untouched; availability is a separate axis.
- **Trip lifecycle as SECURITY DEFINER functions** (migration `0021`):
  `app.create_trip` / `app.assign_trip` / `app.transition_trip`. Each validates
  tenant + actor + the legal state edge + driver/vehicle eligibility, appends a
  `trip_events` row **and** an `audit_logs` row, and broadcasts on
  `org:<id>:dispatch` via `realtime.send` — all in one transaction. `trips` has
  **no** INSERT/UPDATE policy or grant for `authenticated`, so the functions are
  the only write path: clients never get direct column-level write access to
  trips (architecture doc §9 invariant 6). This is the first plpgsql
  lifecycle-function set in the codebase; prior milestones used guarded-`WHERE`
  transitions in tRPC, but trips' richer graph + the "no unrestricted client
  update" invariant justified moving the state machine into the database.
- **RLS** (migration `0021`): SELECT for managers/staff (and the assigned
  driver, for trips/trip_events); telemetry write is staff/adapter-only;
  charging/maintenance are manager-managed. **Realtime** (migration `0023`):
  a private-broadcast receive policy on `realtime.messages` for the
  `org:<id>:dispatch` topic — the only topic the web board subscribes to. The
  `trip:` / `driver:*` topic policies ship with their M9b subscribers rather
  than as unexercised RLS surface.
- **Contracts + tRPC**: `packages/contracts` gains geo/trip/charging/maintenance
  Zod schemas. New routers `trips` (create/assign/transition via the functions,
  `listByOrganization`, `nearestDrivers` KNN), `energy`, `maintenance`; `drivers`
  gains `setOperationalStatus` + `listForDispatch`. Geography is always projected
  to `{lat,lng}` with `gis.ST_X/ST_Y` — the raw geography column never crosses
  the transport boundary. Every write reuses the M8
  `assertCanManageFleetOps` + rate-limit + `writeAuditLog` precedent (the trip
  functions self-audit, so those resolvers don't double-log).
- **Mapbox** (`mapbox-gl` + `react-map-gl`, React-19 compatible): a client-only
  `MapCanvas` (dynamic `ssr:false`), monochrome `light-v11` style per the design
  directive, Guards Red reserved for live-signal markers (on-trip driver /
  active ride). Token is `NEXT_PUBLIC_MAPBOX_TOKEN` (public `pk.*`, browser-safe)
  — never hardcoded; falls back to a static panel when unset.
- **Owner Space UI**: `/space/dispatch` (live map + click-to-create rides +
  assign + advance + a Broadcast-driven live board that refreshes across open
  tabs), `/space/energy`, `/space/maintenance`, an extended sub-nav, and the
  overview's M8 "Preview · Milestone 9" placeholder replaced with a real live
  dispatch card (active/completed ride counts).

## Migration lineage note (drizzle-kit, third recurrence)

`drizzle-kit generate` again mis-numbered the output (`0007_operations_tables`)
even though the snapshot's `prevId` correctly chained off `0015` — the same
heuristic bug caught in M7 and M8. Fixed by renaming the snapshot/journal tag to
`0020` (prevId was already correct) and hand-splitting the generated SQL into
tables (`0020`) / functions+policies (`0021`) / grants (`0022`), with `0019`
(PostGIS) and `0023` (realtime) hand-authored. Drizzle emitted the geography
column type **quoted** (`"gis.geography(Point,4326)"`, which Postgres rejects as
a single identifier); written unquoted in the applied SQL.

## Verification

- All five migrations applied to the live project via the account-scoped
  connector. `get_advisors(security)` — zero new findings (baseline: the
  pre-existing leaked-password WARN).
- **Lifecycle smoke test** (RLS impersonation, same methodology as M5–M8):
  create → assign → en_route → arrived → in_progress → completed produced
  exactly 6 `trip_events` + 6 `audit_logs`, geography round-tripped correctly,
  the driver flipped `on_trip`→`available`. Illegal state-skips rejected; a
  genuine outsider (no role, no membership) rejected on create and transition
  and sees **0** trips under the SELECT policy, while the owner and HOC staff
  each see the row.
- `pnpm typecheck && lint && build` green across all packages; the new
  `/space/dispatch|energy|maintenance` routes build.
- **Map** verified live in the dev server (temporary public harness, since
  authenticated pages can't be driven without a password): monochrome Lagos
  renders, markers place correctly, Guards Red on the on-trip driver, no console
  errors.
- Demo data seeded for the sandbox org (`rider_ref='DEMO'`, clearly labelled,
  removable): driver locations/availability, 4 trips across the lifecycle,
  telemetry, charging, and maintenance — so the presentation shows a live board.

## Deferred to Milestone 09b

The Expo driver app's real functionality (expo-location, offers, trip screens),
bearer-token auth for the `/api/trpc` HTTP route, driver-side live location
broadcast, an automated matching worker, and Sentry/monitoring. The schema, RLS,
Broadcast authorization, and `driver:*` topics built here are the seams M9b
plugs into.

## Follow-up for the operator

`NEXT_PUBLIC_MAPBOX_TOKEN` must be added to the Vercel project env (Production +
Preview) for the production map to render — it is inlined at build time. Until
then the production map shows its static fallback; the dispatch board, energy,
and maintenance surfaces work regardless.
