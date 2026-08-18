# Milestone 08 — Driver management & Owner Space

Status: complete; awaiting approval before Milestone 09.

The first slice of the Owner Space (`app/(owner)/space`), which didn't
exist at all before this milestone: a driver roster, a vehicle↔driver
assignment mechanism, and the fleet owner workspace to operate both from.
Also the security/design elevation confirmed as part of the broader
"strategic MVP enhancement" — an `audit_logs` table and a Postgres-backed
rate limiter, both brought forward from later slots because this is the
first milestone with genuinely audit-worthy, owner/dispatcher-writable
mutations.

## Included

- `drivers` + `shifts` tables (`packages/db/src/schema/drivers.ts`),
  migrations `0015`–`0017`. `shifts` *is* the vehicle↔driver assignment
  mechanism — no vehicle FK on `drivers` itself, matching the
  architecture doc's own shape. "Assigning a vehicle" = opening a
  `shifts` row; "unassigning" = closing it (`endedAt`). Partial unique
  indexes on `driverId` and `vehicleId` (where `ended_at IS NULL`)
  DB-enforce at most one active assignment per driver and per vehicle.
  `drivers.status` reuses the existing `membershipStatus` enum
  (`invited`/`active`/`disabled`) rather than inventing a near-duplicate.
  `shifts.tripCount`/`grossRevenueMinor` exist now, staying honestly `0`
  until Milestone 9 trips exist to populate them.
- `audit_logs` table (`packages/db/src/schema/audit.ts`) — bigint identity
  PK, append-only (no update/delete policy exists at all), staff-only
  read, insert requires `actor_user_id = auth.uid()`. Written via
  `apps/web/src/server/audit/log.ts`'s `writeAuditLog()`, called from
  every driver/shift mutation.
- Postgres-backed fixed-window rate limiter (`private.rate_limits` +
  `private.check_rate_limit()`, migration `0018`) — not a new Redis
  vendor; Postgres is already the shared datastore every request talks
  to. Wrapped by `apps/web/src/server/security/rate-limit.ts`, applied to
  `drivers.create` and `shifts.assign`.
- `canManageFleetOps` (`packages/db/src/schema/_shared.ts`, additive) —
  broader than the existing owner-only `canManageOrg`: fleet operations
  are legitimately a dispatcher's job too. First RLS helper in the
  codebase to actually exercise the `dispatcher` role.
- `assertCanManageFleetOps` (`apps/web/src/server/trpc/authz.ts`) — the
  first owner/dispatcher-gated (not staff-only, not RLS-only) check in
  the codebase. Every prior owner-scoped write relied purely on RLS, with
  the router only checking "0 rows returned → NOT_FOUND"; this gives an
  unauthorized caller a clean `FORBIDDEN` instead of a raw Postgres
  `42501` surfaced as a 500.
- `drivers`/`shifts` tRPC routers
  (`apps/web/src/server/trpc/routers/{drivers,shifts}.ts`): staff/
  owner/dispatcher create/update/assign/end, `protectedProcedure`
  reads scoped by RLS, `staffProcedure` cross-tenant `listAll`.
- Owner Space UI — the first `(owner)` route group:
  `(owner)/layout.tsx` resolves the caller's first managed organization
  (via new `organizations.listManaged`) and gates on it with an honest
  "you don't manage an organization yet" state, matching
  `StaffOnlyNotice`'s pattern; `/space` (overview, `KpiTile`s bound to
  real driver/vehicle/assignment counts plus honest "arriving in
  Milestone 9/10" placeholders for trips/earnings); `/space/drivers`
  (roster + add-driver form) and `/space/drivers/[driverId]` (profile,
  assign/end shift); `/space/fleet` and `/space/fleet/[vehicleId]`
  (vehicle list/detail with the same assign/end-shift flow from the
  vehicle's side, reusing `vehicles.listByOrganization` from Milestone 7
  unchanged). Staff parity: `/admin/drivers`, mirroring `/admin/inventory`.
- `KpiTile`/`StatusDot` needed zero component changes — already fully
  prop-driven since Milestone 3/4, just never called with real data
  before. `/space`'s overview page is their first real-page use.

## Migration issue found and fixed (before applying anything)

`drizzle-kit generate` picked the highest-numbered *snapshot filename*
(`0006_snapshot.json`, an early Milestone 5 fix) as the diff baseline
instead of the actual latest state (`0012_snapshot.json`, Milestone 7),
and **overwrote** `0006_snapshot.json` with the new post-drivers/shifts/
audit_logs state in the process — the same class of lineage-fork bug
fixed once already in Milestone 7, recurring because drizzle-kit's
picking heuristic doesn't traverse the real `id`/`prevId` chain. Caught
immediately by inspecting the diff (`0006_snapshot.json`'s `prevId`
pointed at an unrelated id) before applying anything. The original
`0006_snapshot.json` was recovered from its Milestone 5 commit (`2b8b1e4`)
via `git show`, restored, and the new snapshot correctly renamed to
`0015_snapshot.json` with its `prevId` left pointing at `0012`'s id
(already correct). The generated migration SQL itself was unaffected
(it only ever contained the genuinely new tables) and was applied as
`0015`–`0017` after the standard table/policies/grants split.

## A second bug found by reading the generated SQL, not live

The generated `shifts` INSERT policy's `WITH CHECK` read
`A OR B AND EXISTS(...) AND EXISTS(...)` — since SQL's `AND` binds
tighter than `OR`, this parses as `A OR (B AND EXISTS AND EXISTS)`,
meaning HOC staff (`A`) could bypass the driver/vehicle eligibility
checks entirely via the `OR` short-circuit. Traced to
`canManageFleetOps()` returning an unparenthesized `A or B` fragment
that got interpolated directly into a larger `AND` expression at the
`shifts` insert policy's call site. Fixed at the source — wrapped
`canManageFleetOps`'s own body in explicit parens in `_shared.ts` — since
the helper was brand new and not yet applied anywhere, this closes the
bug for every current and future call site rather than patching one
symptom. Verified: re-tested live afterward (see below) and confirmed an
assignment against a still-`allocated` vehicle is correctly rejected.

## RLS smoke test findings

Same impersonation methodology as Milestones 5–7. This pass specifically
re-tested the exact class of gap Milestone 6 found after the fact (an
insert policy checking *who* but not *what*) — written proactively this
time via a cross-table `EXISTS` subquery from the start (matching
Milestone 7's own precedent), and the precedence bug above was caught
and fixed *before* any live testing, not by the smoke test itself.

- Owner A inserts a driver in their own org → succeeds; same insert
  targeting org B → rejected.
- Dispatcher A inserts a driver in org A → succeeds — the actual new
  behavior `canManageFleetOps` adds (first policy in the codebase to
  exercise the `dispatcher` role).
- A driver-role member attempts a driver insert → rejected.
- Driver-role member selects `drivers` → exactly 1 row (their own), not
  the tenant's whole roster — the first table where `driver` visibility
  is narrower than `canViewOrg`. Owner A selects: all rows in org A, 0
  rows in org B.
- Owner A opens a shift for a `delivered` vehicle → succeeds. A second
  driver assigned to the *same* vehicle while the first shift is still
  open → rejected by `shifts_active_vehicle_idx`.
- Assignment against a still-`allocated` vehicle → rejected by the
  `EXISTS` check (confirms the precedence-bug fix above holds live).
- Assignment referencing an org-B vehicle while acting as owner A →
  rejected (cross-tenant defense-in-depth).
- `audit_logs`: an actor inserting their own entry succeeds; a forged
  `actor_user_id` is rejected; HOC staff can read it; the owner who wrote
  it cannot read it back (staff-only read, by design). One implementation
  note worth flagging: `INSERT ... RETURNING` on `audit_logs` requires
  the row to also satisfy the table's SELECT policy (staff-only) — an
  owner's own insert succeeds *without* `RETURNING` (which is exactly
  what `writeAuditLog()` uses) but would fail *with* it. Confirmed the
  shipped helper doesn't use `.returning()`; documenting this as a trap
  for any future edit to that function.
- Rate limiting: `private.check_rate_limit()` verified directly — first
  N calls within a window return `true`, the next returns `false`. The
  full `driversRouter.create` → `TOO_MANY_REQUESTS` path was verified by
  code review of `assertWithinRateLimit`'s straightforward pass-through
  rather than a live repeated-HTTP-call test this pass, matching the
  scope of the `assertCanManageFleetOps` → clean-403 verification below.
- **Not independently live-tested this pass**: the exact "clean
  `FORBIDDEN` vs. raw `42501`" distinction `assertCanManageFleetOps`
  provides requires an actual tRPC call (not raw SQL) to observe: the
  underlying RLS rejection *is* confirmed live (every unauthorized SQL
  insert attempt above was correctly blocked), and the TypeScript
  wrapper's correctness was confirmed by code review + a clean
  `pnpm typecheck` — but the specific error-shape improvement wasn't
  exercised through a live browser/HTTP round trip this pass.

`get_advisors(type: "security")` — zero new findings (the one WARN
present, leaked-password-protection, predates this milestone). All
synthetic test data (6 users, 2 orgs, 2 applications, 2 orders, 3
vehicles, drivers, shifts, audit log entries) cleaned up afterward.

## Deliberate simplifications vs. the architecture doc

- No `current_location`/PostGIS on `drivers` — deferred to Milestone 9;
  PostGIS isn't enabled yet, and a permanently-null geography column now
  buys nothing.
- No multi-org switcher — first-managed-organization only, both for
  gating (`(owner)/layout.tsx`) and every `/space` page's own queries.
- No driver self-service — the Expo app is still a placeholder scaffold;
  `drivers.profileId` and shift read-visibility exist now so the driver
  app has something to read in Milestone 9, but no driver-facing
  mutation exists yet.
- `audit_logs` read stays HOC-staff-only — the architecture doc itself
  calls a "redacted tenant view" a `later` item, not a Milestone 8 one.
- No `in_transit`/`retired` vehicle lifecycle states, no `vehicle_models`
  table, no telematics reference column — all unchanged from Milestone
  7's own trims; this milestone didn't touch `fleet.ts` at all.

## Claim and data guardrails

- Driver display name, phone, and licence reference are always
  staff/owner/dispatcher-entered — never invented.
- `shifts.currency`/`grossRevenueMinor` stay `0`/`null` honestly until
  Milestone 9/10 trips produce real figures — no placeholder revenue.
- The Owner Space overview page explicitly labels trips/earnings as
  "arriving in Milestone 9/10" rather than showing a fabricated "0" that
  could be mistaken for a real, confirmed-empty count.

## Verification

- `pnpm typecheck && pnpm lint && pnpm build` — pass across all 7
  workspace packages, including every new `/space/*` and `/admin/drivers`
  route.
- `get_advisors(type: "security")` on the live project — zero new
  findings.
- RLS impersonation smoke test (see above) — pass, after the two fixes
  above (migration lineage, policy precedence) were caught and resolved
  *before* applying/testing.
- Guarded-transition idempotency: the underlying `shifts` close-then-open
  pattern reuses the same guarded-`WHERE` discipline as every prior
  milestone's status transitions; not re-verified as a standalone
  duplicate-call test this pass since it doesn't introduce a new
  transition shape beyond what M6/M7 already exercised.

**Not covered**: a full authenticated browser walkthrough of the Owner
Space flow end-to-end (add driver → allocate/deliver/activate a vehicle
as staff → assign → end shift) was not re-run live this pass given the
extensive DB-layer verification above already exercises every guarded
transition and policy the UI calls into identically; recommended before
production launch.

## Deferred to Milestone 09

Dispatch, real-time GPS (`trips`, `trip_events`, PostGIS,
`vehicle_telemetry_snapshots`, Realtime Broadcast authorization), Mapbox
integration (`MapPanel` gets its first real map child), the Expo driver
app's first real functionality, bearer-token auth for the `/api/trpc`
HTTP route, and Sentry/monitoring (introduced there as the first
live-operational, safety-relevant surface).
