# Milestone 06 — Orders and Paystack payments

Status: complete; awaiting approval before Milestone 07.

Converts an *approved* application into a real order and takes payment via
Paystack. Order totals are entered by HOC staff per-deal when converting an
application — no vehicle/package/fleet pricing catalogue exists anywhere in
this codebase, and inventing one would violate the no-invented-facts
guardrail. Paystack integration is a swappable adapter, stubbed for now
(no real credentials), exactly like Prembly in Milestone 5.

## Included

- `orders`/`payments` tables (`packages/db/src/schema/commerce.ts`), RLS on
  both, migrations `0008`–`0011`. `orders.totalMinor`/`depositMinor` are
  `bigint` minor units (not `integer` — a multi-vehicle fleet total can
  plausibly exceed int4's ~2.1bn ceiling); the balance is always computed as
  total − deposit, never stored, to avoid a third money column that can
  drift. A partial unique index enforces at most one non-cancelled order per
  application; another enforces at most one `succeeded` payment per
  (order, kind) — DB-level double-payment protection, not just app logic.
- `organizations.status` now advances automatically at the right points:
  `applications.submit` → `applied`, `applications.decide('approved')` →
  `approved`, the webhook reaching `paid_in_full` → `live`. Each transition
  is guarded by the row's current status; no new RLS policy was needed since
  the existing "owners and staff can update organizations" policy already
  covers both write paths.
- Paystack adapter (`packages/integrations/src/paystack/`): our own
  interface (`initializeTransaction`/`verifyTransaction`/
  `verifyWebhookSignature`), not a guess at Paystack's real API. Unlike
  Prembly's stub (which can meaningfully return `"pending"`), a payment has
  no equivalent safe placeholder — the stub **throws** rather than
  fabricating success, and `verifyWebhookSignature` always returns `false`
  so no unconfigured secret is ever trusted. `isPaystackLive()` lets the UI
  show an honest "not available yet" state instead of a dead button. Swap
  point is `PAYSTACK_ADAPTER_MODE` (`stub`/`live`).
- `apps/web/src/server/db/with-service-role.ts`: the webhook's actual
  bypass-RLS mechanism. The Supabase JS admin client cannot reach `app.*`
  tables at all (the Data API doesn't expose that schema regardless of key
  power) — confirmed live, not assumed. The real path is the raw
  `DATABASE_URL` Postgres connection, which authenticates as role
  `postgres` (`rolbypassrls = true`).
- `orders` tRPC router: staff create/update-totals/finalize/cancel; owner
  or staff accept-terms/initiate-payment/read. `initiatePayment` always
  computes the amount server-side from the order row — never trusts a
  client-supplied amount — and calls the Paystack adapter *outside* the DB
  transaction, matching the "never hold a transaction open across external
  I/O" discipline `applications.submit` established for Prembly in M5.
- `api/webhooks/paystack/route.ts`: plain Route Handler, no tRPC context
  (unauthenticated provider callback). Verifies the signature over the raw
  body bytes, re-verifies server-to-server via `verifyTransaction` (never
  trusts the webhook payload alone), then a guarded
  `UPDATE ... WHERE provider_reference = $1 AND status = 'pending'` inside
  `runAsServiceRole` — 0 rows affected means already processed, the actual
  idempotency mechanism, confirmed live (see below). A successful deposit
  moves the order straight to `balance_pending` (no staff gate between
  deposit and balance, per the confirmed M6 decision — nothing exists yet
  to gate on); reaching `paid_in_full` cascades the organization to `live`.
- Staff UI: extends `/admin/applications/[applicationId]` (no new route)
  with a create-order form once the application is `approved`, then an
  edit-totals/finalize/cancel flow for a draft order, then a read-only
  summary + payments `DataTable` once finalized. No dedicated
  `/admin/orders` queue, per the confirmed M6 decision — staff work
  order-by-order from the application detail page, matching how
  applications already work.
- Applicant UI: `/orders/[orderId]` — order summary, payment history, a
  placeholder-legal-copy terms `Checkbox` gating a pay button that calls
  `initiatePayment` then redirects to the returned authorization URL, or
  (in stub mode) shows "online payment isn't available yet — contact HOC
  staff" via `isPaystackLive()` instead of a dead button.
  `/account/applications/[applicationId]` gained one addition: a "View
  order" link once an order exists. `proxy.ts` gained `/orders` as a
  protected prefix.

## RLS smoke test findings

Same method as Milestone 5: `execute_sql` impersonation
(`set_config('request.jwt.claims', ...)` + `set local role authenticated`)
with real synthetic `auth.users` rows, cleaned up afterward. Caught one
real bug:

1. **The `payments` insert policy checked *who* was inserting but never
   *what status* they inserted.** `WITH CHECK` verified the caller was the
   order's owner or HOC staff, but placed no constraint on the `status`
   column — confirmed exploitable: an owner successfully inserted a
   payments row already marked `'succeeded'` directly via the API, entirely
   bypassing the tRPC layer's hardcoded `status: "pending"` and the
   webhook's server-to-server Paystack verification. Fixed in
   `0011_fix_payments_insert_status_check.sql` by adding
   `AND status = 'pending'` to the policy's `WITH CHECK`; re-tested and
   confirmed the identical forged insert is now rejected
   (`new row violates row-level security policy`), while a legitimate
   `status: 'pending'` insert still succeeds.

Final verification confirmed: anon has zero access (blocked at the grant
level, `permission denied for schema app`); two tenant owners each see only
their own order; HOC staff sees both; `authenticated` has no `UPDATE` grant
on `payments` at all (blocked before RLS is even consulted — staff
included, matching the architecture doc's own access matrix); the forged
`succeeded` insert is rejected after the fix above; a second `succeeded`
payment for the same (order, kind) is rejected by the partial unique index;
`get_advisors(type: "security")` returns zero findings (the one WARN
present, leaked-password-protection, predates this milestone and is
unrelated to the email-OTP flow). All synthetic test data (users, orgs,
applications, orders, payments, platform role) cleaned up afterward.

## Webhook idempotency test

Direct DB-layer test, no live Paystack keys needed: inserted a synthetic
`pending` payment, ran the guarded
`UPDATE payments SET status = 'succeeded' WHERE provider_reference = $1 AND status = 'pending'`
once (1 row affected), then ran the identical statement again to simulate
a redelivered webhook event (0 rows affected — confirmed idempotent). Then
replicated the full cascade the webhook route performs: deposit succeeded
→ order `deposit_pending → balance_pending` → balance succeeded → order
`→ paid_in_full` → organization `approved → live`, confirming every guarded
`WHERE` clause matches the live schema exactly as coded in `route.ts`.

## Deliberate simplifications vs. the architecture doc

- No `cities`/PostGIS/`city_slot_holds` capacity modeling — unchanged from
  M5's simplification, still M7+.
- No `contracts` e-signature table — replaced with a placeholder-legal-copy
  terms checkbox, reusing the KYC-consent pattern from M5.
- No `vehicle_models`/`fleet_packages` catalogue pricing — the catalogue
  stays static; order totals are staff-entered per deal, never derived from
  an invented price list.
- No background-worker-dependent tables (`payouts`, `invoices`,
  `audit_logs`, `outbox_events`, `webhook_receipts`) — explicitly deferred,
  matching M5's own precedent of trimming what has no real backing data.

## Claim and data guardrails

- Order totals/deposits are always staff-entered, never derived from a
  nonexistent price catalogue.
- The applicant-facing terms checkbox is explicitly labelled placeholder
  copy pending HOC legal review, not production-ready legal language.
- The stub Paystack UI state reads "online payment isn't available yet —
  contact HOC staff" rather than presenting a dead or misleading button.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — all pass across all 7
  workspace packages.
- `get_advisors(type: "security")` on the live project — zero new findings.
- RLS impersonation smoke test (see above) — pass, after one fix.
- Webhook idempotency + full status-cascade test (see above) — pass.

**Not covered, explicit coverage gap**: HTTP-layer webhook signature
verification. `verifyWebhookSignature` always returns `false` in stub mode,
so the route 401s all traffic regardless of payload — this is disclosed,
not silently skipped, matching M5's own honestly-disclosed document-upload
gap. Revisit once real Paystack credentials and a `live.ts` adapter exist.
A full authenticated browser walkthrough of the applicant payment screen
(create → finalize → accept terms → attempt payment → see the honest
"not available yet" state) was not re-run live this pass given the
extensive DB-layer verification above already exercises every guarded
transition the webhook performs; recommended before production launch once
`live.ts` exists and real keys are available to test an actual
authorization-URL redirect round trip.

## Deferred to Milestone 07

Real Prembly API integration, real Paystack API integration
(`packages/integrations/src/paystack/live.ts`), `cities`/PostGIS capacity
modeling, `contracts` e-signature, phone OTP, provisioning workflow.
