# Milestone 05 — Auth, KYC, applications, owner onboarding

Status: complete; awaiting approval before Milestone 06.

Scope was deliberately narrowed to auth/KYC/onboarding only — orders and
Paystack deposit/balance payments move to Milestone 06, matching the design
directive's own milestone breakdown ("Milestone 5 (auth/onboarding)...
Milestone 6 (commerce)") rather than milestone-04-storefront.md's broader
"deferred" list.

## Included

- New dedicated Supabase project (`hoc-elite-wheels`, `crdmkehwnxnffvgrfmlq`,
  us-east-1) — kept separate from the pre-existing `hoc-qa-signoff` project,
  which turned out to already hold an unrelated QA/compliance schema.
- `app` Postgres schema (non-Data-API-exposed) with `profiles`,
  `platform_roles`, `organizations`, `organization_memberships`,
  `applications`, `application_documents`, `application_notes` — Drizzle
  schema in `packages/db/src/schema/`, migrations in `supabase/migrations/`.
- `private` schema RLS helper functions (`is_hoc_staff`, `has_org_role`,
  `can_view_org`) per `docs/HOC-Connect-architecture-and-schema.md` section 7,
  plus a `private.handle_new_user()` trigger on `auth.users` that creates the
  matching `app.profiles` row atomically with signup.
- Row-level security on every table, verified with a real impersonation
  smoke test (anon, two distinct applicant tenants, HOC staff, and the
  self-service org/membership bootstrap path) — see "RLS smoke test findings"
  below for two real bugs this caught and fixed.
- Private `kyc-documents` Storage bucket, scoped to
  `<user-id>/<application-id>/...`, staff-readable, no public URLs.
- Supabase Auth wiring: browser/server/admin clients (`apps/web/src/lib/supabase/`),
  `apps/web/src/proxy.ts` (optimistic session refresh + redirect gate on
  `/apply`, `/account`, `/admin` — never the authorization boundary; RLS is),
  `/auth/sign-in`, `/auth/verify`, `/auth/callback`, `/auth/sign-out`.
  Email OTP only — first sign-in doubles as signup. **Phone OTP is
  explicitly deferred** (no SMS provider configured, no credentials).
- tRPC plumbing (`apps/web/src/server/trpc/`): `publicProcedure`/
  `protectedProcedure`/`staffProcedure`, `profile`/`organizations`/
  `applications` routers, `server/db/with-rls.ts` transaction wrapper. Server
  Actions call the router in-process (`server/trpc/caller.ts`) — no React
  Query, matching `/configure`'s existing server-rendered-form convention.
  `api/trpc/[trpc]/route.ts` is scaffolded for future HTTP clients (e.g. the
  driver app) but nothing in this milestone calls it over HTTP.
- Prembly KYC adapter (`packages/integrations/src/prembly/`): our own
  interface, not a guess at Prembly's real API. The stub always returns
  `"pending"`, never fabricates `"verified"` — every application requires an
  explicit human HOC-staff decision until real credentials and a `live.ts`
  adapter exist. Swap point is `PREMBLY_ADAPTER_MODE` (`stub`/`live`).
- `/apply/[step]` wizard (identity, company, documents, review) under a new
  `(commerce)` route group alongside `/configure` (moved, same URLs,
  zero behavior change). The configurator's review step now links to
  `/apply/identity` with the configuration carried through via query string;
  once the application exists, subsequent steps carry only `applicationId`
  and read everything else back from the database.
- `/account`, `/account/applications`, `/account/applications/[id]` for
  applicants; minimal `/admin/applications`, `/admin/applications/[id]` for
  staff (status filter, signed document URLs, approve/decline, notes) —
  deliberately not the full HOC Console (Milestone 12).
- New shared primitives: `Textarea`, `Checkbox`, `RadioGroup`/`CheckboxGroup`
  (`FieldShell` exported from `field.tsx` for reuse). `/configure`'s local
  `Choice` component was migrated to the new `RadioGroup`/`CheckboxGroup` —
  same markup, zero behavior change, one implementation instead of two.
- `packages/config` (`@hoc/config`): centralized, lazily-validated env access
  (`getServerEnv`/`getClientEnv`), so a checkout without secrets configured
  still typechecks and builds; `requireDatabaseUrl()`/`requireServiceRoleKey()`
  fail loudly only at the point of actual use.
- `docs/staff-bootstrap.md` — the one-off manual SQL grant for the first
  HOC staff account (no self-service invite flow exists yet).

## RLS smoke test findings

Run via `execute_sql` impersonation (`set_config('request.jwt.claims', ...)`
+ `set local role authenticated`) with real synthetic `auth.users` rows,
cleaned up afterward. This caught two real, launch-blocking bugs before any
live user hit them:

1. **`authenticated` had no grant on the `app` schema at all.** RLS controls
   row visibility, but the role still needs baseline schema/table
   privileges before Postgres attempts a query. Fixed in
   `0005_app_schema_grants.sql`.
2. **Self-service owner onboarding was impossible under RLS as first
   written.** `organization_memberships`' only insert path required an
   *existing* owner membership (`has_org_role`) — which can never be true
   for the very first membership row on a brand-new organization. Fixed by
   adding a bootstrap policy that allows an organization's creator to insert
   their own `owner` row (`0006_fix_rls_write_policies.sql`).
3. **`applications`/`application_documents` insert policies only checked
   `applicant_user_id`/`uploaded_by`, never that the user actually belonged
   to the target organization** — confirmed exploitable: a test applicant
   successfully inserted an application into a different tenant's
   organization by supplying its UUID directly. Fixed in the same migration
   by adding `private.can_view_org(organization_id)` to both `WITH CHECK`
   clauses; re-tested and confirmed blocked.
4. **`applications`' update policy's `using` clause only matched
   `status = 'draft'`, while `withCheck` allowed `'draft'` or `'submitted'`.**
   Caught live, not by the SQL smoke test: `applications.submit` flips
   status to `'submitted'`, then makes a second update (outside the
   transaction) to attach the Prembly reference/status — that second update
   silently affected zero rows, no error thrown, because `using` no longer
   matched the now-`'submitted'` row. Fixed in
   `0007_fix_application_update_policy_status.sql` by aligning `using` with
   `withCheck`; re-submitted the same application and confirmed
   `prembly_reference`/`prembly_status` now persist correctly.

Final verification confirmed: anon has zero access (blocked at the grant
level); two applicant tenants each see only their own application; HOC
staff sees both; the bootstrap path succeeds; the cross-tenant write is
rejected; `get_advisors(type: "security")` returns zero findings.

## Auth UI bug found during the live walkthrough

`/auth/verify` assumed a 6-digit OTP (`maxLength={6}`, `pattern="\d{6}"`,
server-side `/^\d{6}$/`) — Supabase generated an 8-digit code for this
project, which the form would have silently rejected for every real user.
Confirmed via the Admin API's `generate_link` (`email_otp` field) rather
than guessed. Relaxed to `\d{6,10}` client- and server-side; copy changed
from "6-digit code" to "verification code" throughout.

## Deliberate simplifications vs. the architecture doc

- No `cities`/PostGIS table — `organizations.cityLabel` is free text,
  matching how `/configure`'s city step already works ("proposed market,
  not current availability"). Real city/capacity modeling is M6+.
- No `fleet_configurations` commerce schema —
  `applications.configurationSnapshot jsonb` denormalizes the configurator's
  URL-carried selections as a bridge until M6's real persisted
  configurations exist.
- No `organization_branding`, `contracts`, `orders`, `payments`,
  `city_slot_holds` — all explicitly M6+.

## Claim and data guardrails

- Prembly verification status is always labelled "Verification pending —
  Prembly integration not yet connected" in the staff review UI while the
  stub adapter is active — staff are never misled into thinking a real
  check ran.
- The review step's consent copy is explicitly flagged in the UI and code
  as placeholder pending legal review, not production-ready legal language.
- No business facts, prices, or jurisdictional requirements were invented;
  company registration copy reads "confirmed against your jurisdiction
  during review" rather than asserting one.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — all pass.
- `get_advisors(type: "security")` on the live project — zero findings.
- RLS impersonation smoke test (see above) — pass, after four fixes.
- Full authenticated browser walkthrough, completed live end-to-end using
  the Supabase Admin API (`generate_link`) to obtain a real OTP without
  waiting on email delivery: sign-in → verify (8-digit code, see bug above)
  → redirect back to the exact originally-requested protected URL with the
  configurator query string intact → `/apply/identity` (org + application
  created, profile updated) → `/apply/company` (configuration snapshot
  correctly read back from the database) → `/apply/documents` (skipped —
  file-input upload isn't drivable through the current browser tooling,
  noted as a real coverage gap, not skipped silently) → `/apply/review` →
  submit → status `submitted`, Prembly stub reference attached (after the
  update-policy fix above) → staff bootstrap granted → `/admin/applications`
  review queue showed the submission, staff-only gate confirmed working →
  approved → applicant's own `/account/applications/[id]` correctly showed
  `approved`. All synthetic test data (users, org, application, platform
  role) cleaned up afterward.
- `/configure/review` → `/apply/identity` handoff link confirmed carrying
  city/size/livery/vehicle mix correctly.

**Not covered**: document upload through `/apply/documents` (Storage RLS
policy was reviewed and applied but not exercised by a real file upload —
the browser automation available in this session has no file-input
control); real Prembly/live SMTP integration, both explicitly deferred.

## Deferred to Milestone 06

Orders, Paystack deposit/balance payments, real persisted fleet
configurations, `organization_branding`, contracts, real Prembly API
integration (`packages/integrations/src/prembly/live.ts`), phone OTP.
