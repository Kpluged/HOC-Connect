import { sql } from "drizzle-orm";
import { check, pgPolicy, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, canViewOrg, isHocStaff, timestamps } from "./_shared";
import { orders } from "./commerce";
import { vehicleLifecycleStatus } from "./enums";
import { organizations } from "./organizations";

/**
 * Milestone 7 - staff-only physical vehicle allocation once an order is
 * paid_in_full (docs/HOC-Connect-architecture-and-schema.md section 9,
 * invariant 3). vehicleModelSlug is free text matching
 * apps/web/src/features/catalogue/data.ts's static Vehicle.slug - no
 * vehicle_models DB table exists (deliberately deferred since M5/6, same
 * pattern as applications.configurationSnapshot.vehicleSlugs). Every row
 * carries its VIN at creation time - no reserve-then-attach-VIN flow this
 * pass. Minimal 3-state lifecycle only: allocated -> delivered -> active
 * (no in_transit/retired, no telematics reference - both deferred).
 *
 * Exported as `fleetVehicles` (Postgres table name stays "vehicles") to
 * avoid colliding with the catalogue's own `vehicles` array export.
 */
export const fleetVehicles = app
  .table(
    "vehicles",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      // Every allocation fulfills a specific paid order - not nullable.
      orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id),
      vehicleModelSlug: text("vehicle_model_slug").notNull(),
      vin: text("vin").notNull(),
      plate: text("plate"),
      status: vehicleLifecycleStatus("status").notNull().default("allocated"),
      allocatedByUserId: uuid("allocated_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      allocatedAt: timestamp("allocated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      deliveredAt: timestamp("delivered_at", { withTimezone: true }),
      activatedAt: timestamp("activated_at", { withTimezone: true }),
      ...timestamps(),
    },
    (table) => [
      // Real-world VINs are globally unique - plain unique index, not
      // partial (unlike payments' partial-succeeded-only index, there's no
      // "cancelled doesn't count" equivalent state here).
      uniqueIndex("vehicles_vin_idx").on(table.vin),
      check("vehicles_vin_not_blank", sql`char_length(btrim(${table.vin})) > 0`),

      pgPolicy("tenant and staff can select vehicles", {
        for: "select",
        to: authenticatedRole,
        using: canViewOrg(table.organizationId),
      }),
      // Defense-in-depth beyond the tRPC layer's own paid_in_full check -
      // closes the same class of gap the M6 smoke test found in payments
      // (insert policy checked WHO but not WHAT). Checks the *referenced
      // order's* status via subquery, directly enforcing architecture doc
      // section 9 invariant 3 at the RLS layer. Pattern matches
      // organizations.ts's own membership-insert EXISTS subquery.
      pgPolicy("staff can insert vehicles for paid orders", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`${isHocStaff} and exists (
          select 1 from ${orders} o
          where o.id = ${table.orderId} and o.status = 'paid_in_full'
        )`,
      }),
      pgPolicy("staff can update vehicles", {
        for: "update",
        to: authenticatedRole,
        using: isHocStaff,
        withCheck: isHocStaff,
      }),
    ],
  )
  .enableRLS();
