import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgPolicy,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, canManageFleetOps, geographyPoint, timestamps } from "./_shared";
import { driverOperationalStatus, membershipStatus } from "./enums";
import { fleetVehicles } from "./fleet";
import { profiles } from "./identity";
import { organizations } from "./organizations";

/**
 * Milestone 8 - driver roster. No vehicle FK here on purpose: `shifts`
 * (below) is the vehicle<->driver assignment mechanism, not a column on
 * this table - matches docs/HOC-Connect-architecture-and-schema.md
 * section 4's own `drivers` shape. Reuses the existing membershipStatus
 * enum (invited/active/disabled) rather than inventing a near-duplicate
 * 3-value lifecycle.
 */
export const drivers = app
  .table(
    "drivers",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      profileId: uuid("profile_id").references(() => profiles.id),
      displayName: text("display_name").notNull(),
      phone: text("phone"),
      // Free text, not a hard enum - real Prembly vocabulary is
      // unconfirmed, same pattern as applications.premblyStatus.
      premblyReference: text("prembly_reference"),
      premblyStatus: text("prembly_status"),
      licenceReference: text("licence_reference"),
      status: membershipStatus("status").notNull().default("invited"),
      // Milestone 9: live dispatch state, additive to the M8 columns. The
      // vetting state (status) and the dispatch state (operationalStatus) are
      // deliberately separate axes. currentLocation/lastSeenAt stay null until
      // the driver app (M9b) reports them; demo rows are seeded staff-side.
      operationalStatus: driverOperationalStatus("operational_status")
        .notNull()
        .default("offline"),
      currentLocation: geographyPoint("current_location"),
      lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
      createdByUserId: uuid("created_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      uniqueIndex("drivers_org_profile_idx").on(
        table.organizationId,
        table.profileId,
      ),
      // Partial GiST index backing the tenant-scoped nearest-driver KNN query
      // (architecture doc §6) - only available drivers with a known location.
      index("drivers_available_location_gist")
        .using("gist", table.currentLocation)
        .where(
          sql`${table.operationalStatus} = 'available' and ${table.currentLocation} is not null`,
        ),
      check(
        "drivers_display_name_not_blank",
        sql`char_length(btrim(${table.displayName})) > 0`,
      ),

      // First table in the codebase where the 'driver' role's own SELECT
      // visibility is narrower than canViewOrg - a driver sees only their
      // own row, not the tenant's whole roster.
      pgPolicy("managers and staff see all tenant drivers, driver sees own row", {
        for: "select",
        to: authenticatedRole,
        using: sql`${canManageFleetOps(table.organizationId)} or ${table.profileId} = ${authUid}`,
      }),
      pgPolicy("managers and staff can insert drivers", {
        for: "insert",
        to: authenticatedRole,
        withCheck: canManageFleetOps(table.organizationId),
      }),
      pgPolicy("managers and staff can update drivers", {
        for: "update",
        to: authenticatedRole,
        using: canManageFleetOps(table.organizationId),
        withCheck: canManageFleetOps(table.organizationId),
      }),
    ],
  )
  .enableRLS();

/**
 * The vehicle<->driver assignment mechanism: "assigning a vehicle" =
 * opening a shifts row; "unassigning" = closing it (endedAt). An active
 * assignment is `shifts` where ended_at is null - gives assignment
 * history for free instead of a single mutable column. tripCount/
 * grossRevenueMinor exist now so Milestone 10 has somewhere to write real
 * earnings later; they stay honestly 0 until Milestone 9 trips exist.
 */
export const shifts = app
  .table(
    "shifts",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      driverId: uuid("driver_id")
        .notNull()
        .references(() => drivers.id),
      vehicleId: uuid("vehicle_id")
        .notNull()
        .references(() => fleetVehicles.id),
      startedAt: timestamp("started_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      endedAt: timestamp("ended_at", { withTimezone: true }),
      tripCount: integer("trip_count").notNull().default(0),
      grossRevenueMinor: bigint("gross_revenue_minor", { mode: "number" })
        .notNull()
        .default(0),
      // Nullable until Milestone 10 populates real revenue - no invented
      // currency on a shift that has never actually earned anything.
      currency: text("currency"),
      createdByUserId: uuid("created_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      endedByUserId: uuid("ended_by_user_id").references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      // At most one active (ended_at is null) shift per driver and per
      // vehicle, DB-enforced - a driver can't be double-booked and a
      // vehicle can't be driven by two people at once.
      uniqueIndex("shifts_active_driver_idx")
        .on(table.driverId)
        .where(sql`${table.endedAt} is null`),
      uniqueIndex("shifts_active_vehicle_idx")
        .on(table.vehicleId)
        .where(sql`${table.endedAt} is null`),
      check("shifts_trip_count_non_negative", sql`${table.tripCount} >= 0`),
      check(
        "shifts_gross_revenue_non_negative",
        sql`${table.grossRevenueMinor} >= 0`,
      ),
      check(
        "shifts_currency_format",
        sql`${table.currency} is null or char_length(${table.currency}) = 3`,
      ),
      check(
        "shifts_ended_after_started",
        sql`${table.endedAt} is null or ${table.endedAt} > ${table.startedAt}`,
      ),

      pgPolicy("managers, staff, and the assigned driver can select shifts", {
        for: "select",
        to: authenticatedRole,
        using: sql`${canManageFleetOps(table.organizationId)} or exists (
          select 1 from ${drivers} d
          where d.id = ${table.driverId} and d.profile_id = ${authUid}
        )`,
      }),
      // Defense-in-depth mirroring Milestone 7's vehicle-insert EXISTS
      // pattern: the driver and vehicle must both actually belong to this
      // org, and the vehicle must be delivered/active, not still
      // 'allocated'.
      pgPolicy("managers and staff can insert shifts for eligible drivers and vehicles", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`${canManageFleetOps(table.organizationId)}
          and exists (
            select 1 from ${drivers} d
            where d.id = ${table.driverId} and d.organization_id = ${table.organizationId}
          )
          and exists (
            select 1 from ${fleetVehicles} v
            where v.id = ${table.vehicleId}
              and v.organization_id = ${table.organizationId}
              and v.status in ('delivered', 'active')
          )`,
      }),
      pgPolicy("managers and staff can update shifts", {
        for: "update",
        to: authenticatedRole,
        using: canManageFleetOps(table.organizationId),
        withCheck: canManageFleetOps(table.organizationId),
      }),
    ],
  )
  .enableRLS();
