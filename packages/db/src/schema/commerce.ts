import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, canViewOrg, isHocStaff, timestamps } from "./_shared";
import { applications } from "./applications";
import { orderStatus, paymentKind, paymentStatus } from "./enums";
import { organizations } from "./organizations";

/**
 * No vehicle_models/fleet_packages catalogue pricing in Milestone 6 either -
 * totalMinor/depositMinor are entered by HOC staff when converting an
 * *approved* application into an order (real B2B fleet-sales behaviour),
 * never derived from an invented price list. No cities/city_slot_holds
 * capacity model and no contracts e-signature table - see
 * docs/milestone-06-commerce-payments.md for the full trimming rationale.
 * balanceMinor is intentionally NOT stored (= totalMinor - depositMinor) to
 * avoid a third money column that can drift.
 */
export const orders = app
  .table(
    "orders",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      applicationId: uuid("application_id")
        .notNull()
        .references(() => applications.id),
      status: orderStatus("status").notNull().default("draft"),
      // bigint, not integer: a multi-vehicle fleet total in minor units can
      // plausibly exceed int4's ~2.1bn ceiling regardless of currency.
      // mode: "number" is safe to 2^53, far beyond any realistic total.
      totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
      depositMinor: bigint("deposit_minor", { mode: "number" }).notNull(),
      currency: text("currency").notNull(),
      pricingNote: text("pricing_note"),
      createdByUserId: uuid("created_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
      termsAcceptedByUserId: uuid("terms_accepted_by_user_id").references(
        () => authUsers.id,
      ),
      ...timestamps(),
    },
    (table) => [
      // At most one non-cancelled order per application - staff can start a
      // fresh order after cancelling a prior one, never two live orders at
      // once.
      uniqueIndex("orders_active_application_idx")
        .on(table.applicationId)
        .where(sql`${table.status} <> 'cancelled'`),
      check("orders_total_non_negative", sql`${table.totalMinor} >= 0`),
      check(
        "orders_deposit_within_total",
        sql`${table.depositMinor} >= 0 and ${table.depositMinor} <= ${table.totalMinor}`,
      ),
      check("orders_currency_format", sql`char_length(${table.currency}) = 3`),

      pgPolicy("tenant and staff can select orders", {
        for: "select",
        to: authenticatedRole,
        using: canViewOrg(table.organizationId),
      }),
      pgPolicy("staff can insert orders", {
        for: "insert",
        to: authenticatedRole,
        withCheck: isHocStaff,
      }),
      pgPolicy("staff can update orders", {
        for: "update",
        to: authenticatedRole,
        using: isHocStaff,
        withCheck: isHocStaff,
      }),
      // Owner-only, and only while a payment is actually due for the first
      // time (deposit_pending) - termsAcceptedAt is a one-time acceptance
      // never rewritten later, so this can't hit the "using doesn't match
      // the state a second write needs" bug class from Milestone 5.
      pgPolicy("owner can accept order terms while deposit is due", {
        for: "update",
        to: authenticatedRole,
        using: sql`(select private.has_org_role(${table.organizationId}, array['owner']::text[])) and ${table.status} = 'deposit_pending'`,
        withCheck: sql`(select private.has_org_role(${table.organizationId}, array['owner']::text[])) and ${table.status} = 'deposit_pending'`,
      }),
    ],
  )
  .enableRLS();

/**
 * status only ever transitions away from 'pending' via the webhook route,
 * which bypasses RLS entirely (the raw DATABASE_URL connection runs as
 * `postgres`, rolbypassrls=true - confirmed live against the project, not
 * assumed). Deliberately NO update policy for `authenticated` here, staff
 * included - matches the architecture doc's own access matrix ("Payments
 * ... HOC staff/admin: Read"). Insert is scoped to the owner/staff who may
 * legitimately start a payment attempt; only the verified webhook may ever
 * mark one succeeded.
 */
export const payments = app
  .table(
    "payments",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id),
      // Denormalized for cheap RLS, same pattern as application_documents.
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      kind: paymentKind("kind").notNull(),
      status: paymentStatus("status").notNull().default("pending"),
      amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
      currency: text("currency").notNull(),
      // Our own generated reference, passed to Paystack's initialize call
      // and echoed back on every webhook event for this attempt - the
      // idempotency anchor.
      providerReference: text("provider_reference").notNull(),
      providerTransactionId: text("provider_transaction_id"),
      providerMetadata: jsonb("provider_metadata"),
      initiatedByUserId: uuid("initiated_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      uniqueIndex("payments_provider_reference_idx").on(
        table.providerReference,
      ),
      // At most one succeeded payment per (order, kind) - DB-enforced, not
      // just app-logic-enforced, so a redelivered/racing webhook can never
      // double-count a deposit or balance payment.
      uniqueIndex("payments_succeeded_order_kind_idx")
        .on(table.orderId, table.kind)
        .where(sql`${table.status} = 'succeeded'`),
      check("payments_amount_non_negative", sql`${table.amountMinor} >= 0`),
      check(
        "payments_currency_format",
        sql`char_length(${table.currency}) = 3`,
      ),

      pgPolicy("tenant and staff can select payments", {
        for: "select",
        to: authenticatedRole,
        using: canViewOrg(table.organizationId),
      }),
      // status = 'pending' is enforced here too, not just app-layer - RLS is
      // the real boundary. Without it, an owner or staff could insert a
      // payments row already marked 'succeeded' directly via the API,
      // skipping both the tRPC layer's hardcoded status and the webhook's
      // server-to-server Paystack verification entirely. Caught live in
      // the M6 RLS smoke test.
      pgPolicy("owner or staff can insert payment attempts", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`(${isHocStaff} or (select private.has_org_role(${table.organizationId}, array['owner']::text[]))) and ${table.status} = 'pending'`,
      }),
      // No update policy at all for `authenticated` - intentional.
    ],
  )
  .enableRLS();
