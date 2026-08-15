# Milestone 07 — Vehicle provisioning

Status: complete; awaiting approval before Milestone 08.

Once an order reaches `paid_in_full`, HOC staff record which real, physical
EV unit (VIN, plate) was handed to that organization, then track it through
delivery to activation. Per `docs/HOC-Connect-architecture-and-schema.md`
section 9 invariant 3 ("physical vehicle allocation and live activation
require `paid_in_full`") and the routing table's `/admin/inventory` entry.
Deliberately narrow and staff-only this pass — no Owner Space UI exists yet
(confirmed `app/(owner)/space` doesn't exist), no telematics, no driver
assignment.

## Included

- `vehicles` table (`packages/db/src/schema/fleet.ts`, exported as
  `fleetVehicles` — the Postgres table name stays `"vehicles"`, only the
  Drizzle export is renamed to avoid colliding with the catalogue's own
  `vehicles` array), migrations `0012`–`0014`. Minimal 3-state lifecycle
  only: `allocated -> delivered -> active` (no `in_transit`/`retired`, no
  telematics reference column — both explicitly deferred). VIN is required
  at allocation time (no reserve-then-attach flow) and globally unique via
  a plain `uniqueIndex`. `vehicleModelSlug` is free text matching the
  static catalogue's `Vehicle.slug` (`apps/web/src/features/catalogue/data.ts`)
  — no `vehicle_models` DB table exists, deliberately deferred since M5/6,
  same pattern as `applications.configurationSnapshot.vehicleSlugs`.
- RLS goes further than a tRPC-layer check: the INSERT policy encodes
  invariant 3 directly as a cross-table `EXISTS` subquery against the
  referenced order's `status`, not just "who is inserting" — see "RLS smoke
  test findings" below for why this was written proactively rather than
  discovered after the fact. UPDATE (delivered/active transitions) is
  staff-only too; unlike `payments`, there's no automated-actor-only
  requirement here (no webhook), so `update` is granted to `authenticated`
  alongside `select`/`insert` — RLS is what actually restricts it to staff.
- `vehicles` tRPC router (`apps/web/src/server/trpc/routers/fleet.ts`):
  `allocate` (staff, verifies `order.status === "paid_in_full"` and VIN
  uniqueness before insert, mirroring `orders.createForApplication`'s
  approved-application check), `markDelivered`/`activate` (staff, guarded
  single-column transitions matching the `orders`/`payments` pattern from
  M6), `listByOrganization` (protected, org-scoped — matches the RLS
  SELECT policy's own granularity), `listAll` (staff, optional status
  filter, cross-tenant join to `organizations` for display name, mirrors
  `orders.listForReview`).
- Staff UI: extends `/admin/applications/[applicationId]` (no new route for
  allocation itself) with a Fleet section once the application's order is
  `paid_in_full` — a model/VIN/plate allocation form plus a table of
  already-allocated vehicles with inline "Mark delivered"/"Activate"
  actions. Also adds the one genuinely new route the architecture doc's
  routing table already reserved: `/admin/inventory` — a cross-tenant,
  status-filterable list of every allocated vehicle, mirroring
  `/admin/applications`' list-page pattern exactly (`StaffOnlyNotice` gate,
  filter chips, `DataTable`).
- Vehicle display name is always resolved via
  `getVehicle(vehicleModelSlug)?.name ?? vehicleModelSlug` at render time in
  both UI surfaces — never stored denormalized in the DB, so it can't drift
  if catalogue copy changes later.

## Migration tooling issue found and fixed

`drizzle-kit generate` picks the snapshot file with the numerically highest
filename as "the current state to diff against" — it does not actually
traverse the `id`/`prevId` lineage chain. Because earlier migrations in this
project were split and renamed by hand (matching the established convention
of keeping the real `.sql` files in true chronological order), the
snapshot `.json` files' own internal numbering had drifted out of sync with
that real order: `0006_snapshot.json` (an early M5 fix) had a *higher*
number than `0003_snapshot.json` (a later M6 migration), so `generate`
picked 0006 as the baseline instead of 0003, silently forking the lineage
and re-emitting the *entire* already-applied `orders`/`payments` schema
into this migration's output alongside the genuinely new `vehicles` table.
Caught by inspecting the generated SQL before applying anything (it
included byte-identical `CREATE TABLE`/`CREATE POLICY` statements for
tables already live), not discovered live. Fixed by renaming the snapshot
files to match their real chronological position (`0003_snapshot.json` →
`0008_snapshot.json`, matching `0008_orders_payments_tables.sql`) and
correcting the new snapshot's `prevId` to chain from it — the split
`0012_vehicles_table.sql` applied to the database itself contains only the
genuinely new statements. Future `generate` calls should now diff correctly
against the true latest state.

## RLS smoke test findings

Same method as Milestones 5 and 6: `execute_sql` impersonation
(`set_config('request.jwt.claims', ...)` + `set local role authenticated`)
with real synthetic `auth.users` rows, cleaned up afterward. This pass
specifically re-tested the exact class of gap M6 found after the fact
(an insert policy checking *who* but not *what*) — written proactively
this time as a cross-table `EXISTS` subquery from the start, and verified
live rather than assumed correct from the policy text alone:

- An owner attempting to directly `INSERT` a vehicle for their own
  `paid_in_full` order — **rejected** (staff-only, confirmed a tenant
  owner cannot self-allocate even against their own paid order).
- Staff attempting to `INSERT` a vehicle against an order that is *not*
  `paid_in_full` (`deposit_pending`) — **rejected** by the `EXISTS`
  subquery, confirming invariant 3 is enforced at the RLS layer itself,
  not only in application code.
- Staff inserting a vehicle for the correctly `paid_in_full` order —
  **succeeded**.
- Tenant isolation on `SELECT` — an owner sees only their own
  organization's vehicles; a second owner sees zero rows; staff sees all.
- An owner attempting to directly `UPDATE` a vehicle's status —
  **rejected** (no owner update policy exists at all).
- Guarded lifecycle transition (`allocated -> delivered`) run twice via
  the exact `WHERE id = $1 AND status = 'allocated'` statement the router
  uses — 1 row affected on the first run, 0 on the repeat (idempotent).

`get_advisors(type: "security")` — zero new findings (the one WARN
present, leaked-password-protection, predates this milestone). All
synthetic test data (users, orgs, applications, orders, vehicles) cleaned
up afterward.

## Deliberate simplifications vs. the architecture doc

- No `in_transit`/`retired` lifecycle states — only
  `allocated -> delivered -> active`, confirmed scope decision.
- No reserve-then-attach-VIN flow — VIN is required at allocation time.
- No `vehicle_models` DB table — `vehicleModelSlug` stays free text against
  the static catalogue.
- No telematics reference column — nothing yet to connect it to.
- No Owner Space UI (`/space/fleet`) — staff-only this pass.
- No dedicated `organization_id`/`order_id` b-tree indexes beyond what
  already backs a real constraint — consistent with `orders`/`payments`'
  own precedent from M6, not a new gap.

## Claim and data guardrails

- VIN and plate are always staff-entered — never invented or
  auto-generated.
- VIN is normalized to trimmed-uppercase in exactly one place
  (`vinSchema` in `packages/contracts`), so the database's plain unique
  index can't be silently bypassed by case variation.
- Vehicle model display name is resolved from the static catalogue at
  render time, never stored denormalized.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — pass across all 7
  workspace packages.
- `get_advisors(type: "security")` on the live project — zero new
  findings.
- RLS impersonation smoke test (see above) — pass, including the
  proactive `EXISTS`-subquery check.
- Guarded-transition idempotency check (see above) — pass.

**Not covered**: a full authenticated browser walkthrough of the staff
allocation flow end-to-end (create order → mark paid → allocate → mark
delivered → activate) was not re-run live this pass given the extensive
DB-layer verification above already exercises every guarded transition the
router performs identically; recommended before production launch.

## Deferred to Milestone 08

Driver management (`drivers`, `shifts`), `in_transit`/`retired` vehicle
lifecycle states, `vehicle_models` catalogue table, telematics/
`vehicle_telemetry_snapshots`, Owner Space fleet views (`/space/fleet`,
`/space/fleet/[vehicleId]`).
