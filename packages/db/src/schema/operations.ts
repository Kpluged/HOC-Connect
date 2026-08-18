import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import {
  app,
  canManageFleetOps,
  canViewOrg,
  geographyPoint,
  isHocStaff,
  moneyMinor,
  timestamps,
} from "./_shared";
import { drivers } from "./drivers";
import {
  chargingStatus,
  maintenanceSeverity,
  maintenanceStatus,
  tripSource,
  tripStatus,
  vehicleHealthState,
} from "./enums";
import { fleetVehicles } from "./fleet";
import { organizations } from "./organizations";

/**
 * Milestone 9 - the operations domain
 * (docs/HOC-Connect-architecture-and-schema.md §4, §6, §9).
 *
 * `trips` has NO insert/update policy for `authenticated` on purpose: every
 * write goes through the SECURITY DEFINER lifecycle functions installed in the
 * 0021 migration (app.create_trip / app.assign_trip / app.transition_trip),
 * which validate tenant + actor + legal state edge + driver/vehicle
 * availability, append a trip_events + audit_logs row, and broadcast, all in
 * one transaction. Clients therefore never get direct column-level write
 * access to trips (architecture doc §9 invariant 6). Only the SELECT policy is
 * declared here.
 */
export const trips = app
  .table(
    "trips",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      vehicleId: uuid("vehicle_id").references(() => fleetVehicles.id),
      driverId: uuid("driver_id").references(() => drivers.id),
      source: tripSource("source").notNull().default("manual"),
      riderRef: text("rider_ref"),
      pickupLabel: text("pickup_label").notNull(),
      pickup: geographyPoint("pickup").notNull(),
      dropoffLabel: text("dropoff_label").notNull(),
      dropoff: geographyPoint("dropoff").notNull(),
      status: tripStatus("status").notNull().default("requested"),
      distanceMeters: integer("distance_meters"),
      // Watt-hours (integer) rather than a float kWh - display divides by 1000.
      energyWh: integer("energy_wh"),
      fareMinor: moneyMinor("fare_minor"),
      // Nullable + set only alongside a fare - no invented currency on a ride
      // that has no confirmed fare yet (same discipline as shifts.currency).
      currency: text("currency"),
      requestedAt: timestamp("requested_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      assignedAt: timestamp("assigned_at", { withTimezone: true }),
      startedAt: timestamp("started_at", { withTimezone: true }),
      completedAt: timestamp("completed_at", { withTimezone: true }),
      cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
      createdByUserId: uuid("created_by_user_id").references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      check(
        "trips_fare_nonnegative",
        sql`${table.fareMinor} is null or ${table.fareMinor} >= 0`,
      ),
      check(
        "trips_distance_nonnegative",
        sql`${table.distanceMeters} is null or ${table.distanceMeters} >= 0`,
      ),
      check(
        "trips_energy_nonnegative",
        sql`${table.energyWh} is null or ${table.energyWh} >= 0`,
      ),
      check(
        "trips_currency_format",
        sql`${table.currency} is null or char_length(${table.currency}) = 3`,
      ),
      check(
        "trips_fare_requires_currency",
        sql`${table.fareMinor} is null or ${table.currency} is not null`,
      ),
      index("trips_org_status_requested_idx").on(
        table.organizationId,
        table.status,
        table.requestedAt,
      ),
      index("trips_driver_status_idx").on(table.driverId, table.status),
      index("trips_pickup_gist").using("gist", table.pickup),
      index("trips_dropoff_gist").using("gist", table.dropoff),

      pgPolicy("managers, staff, and the assigned driver can select trips", {
        for: "select",
        to: authenticatedRole,
        using: sql`${canManageFleetOps(table.organizationId)} or exists (
          select 1 from ${drivers} d
          where d.id = ${table.driverId} and d.profile_id = ${authUid}
        )`,
      }),
    ],
  )
  .enableRLS();

/**
 * Append-only lifecycle audit stream for trips - one row per state change,
 * written only inside the lifecycle functions (no INSERT/UPDATE/DELETE policy
 * for authenticated). Mirrors audit_logs' append-only shape.
 */
export const tripEvents = app
  .table(
    "trip_events",
    {
      id: bigint("id", { mode: "number" })
        .generatedAlwaysAsIdentity()
        .primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      tripId: uuid("trip_id")
        .notNull()
        .references(() => trips.id),
      eventType: text("event_type").notNull(),
      fromStatus: tripStatus("from_status"),
      toStatus: tripStatus("to_status"),
      actorUserId: uuid("actor_user_id").references(() => authUsers.id),
      payload: jsonb("payload"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      index("trip_events_trip_idx").on(table.tripId, table.createdAt),
      index("trip_events_org_idx").on(table.organizationId, table.createdAt),

      pgPolicy(
        "managers, staff, and the assigned driver can select trip events",
        {
          for: "select",
          to: authenticatedRole,
          using: sql`${canManageFleetOps(table.organizationId)} or exists (
            select 1 from ${trips} t
            join ${drivers} d on d.id = t.driver_id
            where t.id = ${table.tripId} and d.profile_id = ${authUid}
          )`,
        },
      ),
    ],
  )
  .enableRLS();

/**
 * One current-state row per vehicle. Adapter/staff-write only (architecture
 * doc §4) - managers read telemetry but never hand-edit it; live provider
 * writes arrive via the service role in M9b.
 */
export const vehicleTelemetrySnapshots = app
  .table(
    "vehicle_telemetry_snapshots",
    {
      vehicleId: uuid("vehicle_id")
        .primaryKey()
        .references(() => fleetVehicles.id),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      location: geographyPoint("location"),
      stateOfChargePct: integer("state_of_charge_pct"),
      odometerKm: integer("odometer_km"),
      healthState: vehicleHealthState("health_state"),
      source: text("source").notNull().default("demo"),
      observedAt: timestamp("observed_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      ...timestamps(),
    },
    (table) => [
      check(
        "telemetry_soc_range",
        sql`${table.stateOfChargePct} is null or (${table.stateOfChargePct} between 0 and 100)`,
      ),
      check(
        "telemetry_odometer_nonnegative",
        sql`${table.odometerKm} is null or ${table.odometerKm} >= 0`,
      ),
      index("telemetry_org_idx").on(table.organizationId),
      index("telemetry_location_gist").using("gist", table.location),

      pgPolicy("tenant and staff can select telemetry", {
        for: "select",
        to: authenticatedRole,
        using: canViewOrg(table.organizationId),
      }),
      pgPolicy("staff can insert telemetry", {
        for: "insert",
        to: authenticatedRole,
        withCheck: isHocStaff,
      }),
      pgPolicy("staff can update telemetry", {
        for: "update",
        to: authenticatedRole,
        using: isHocStaff,
        withCheck: isHocStaff,
      }),
    ],
  )
  .enableRLS();

/** Charging sessions - manager/dispatcher-managed, tenant-readable. */
export const chargingSessions = app
  .table(
    "charging_sessions",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      vehicleId: uuid("vehicle_id")
        .notNull()
        .references(() => fleetVehicles.id),
      driverId: uuid("driver_id").references(() => drivers.id),
      locationLabel: text("location_label"),
      status: chargingStatus("status").notNull().default("in_progress"),
      energyWh: integer("energy_wh"),
      costMinor: moneyMinor("cost_minor"),
      currency: text("currency"),
      startedAt: timestamp("started_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      endedAt: timestamp("ended_at", { withTimezone: true }),
      createdByUserId: uuid("created_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      check(
        "charging_energy_nonnegative",
        sql`${table.energyWh} is null or ${table.energyWh} >= 0`,
      ),
      check(
        "charging_cost_nonnegative",
        sql`${table.costMinor} is null or ${table.costMinor} >= 0`,
      ),
      check(
        "charging_currency_format",
        sql`${table.currency} is null or char_length(${table.currency}) = 3`,
      ),
      check(
        "charging_cost_requires_currency",
        sql`${table.costMinor} is null or ${table.currency} is not null`,
      ),
      check(
        "charging_ended_after_started",
        sql`${table.endedAt} is null or ${table.endedAt} > ${table.startedAt}`,
      ),
      index("charging_org_idx").on(table.organizationId, table.startedAt),
      index("charging_vehicle_idx").on(table.vehicleId),

      pgPolicy("tenant and staff can select charging sessions", {
        for: "select",
        to: authenticatedRole,
        using: canViewOrg(table.organizationId),
      }),
      // Defense-in-depth mirroring shifts/vehicles: the referenced vehicle must
      // belong to this org. Enforced live by migration 0024.
      pgPolicy("managers and staff can insert charging sessions", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`${canManageFleetOps(table.organizationId)}
          and exists (
            select 1 from ${fleetVehicles} v
            where v.id = ${table.vehicleId} and v.organization_id = ${table.organizationId}
          )`,
      }),
      pgPolicy("managers and staff can update charging sessions", {
        for: "update",
        to: authenticatedRole,
        using: canManageFleetOps(table.organizationId),
        withCheck: canManageFleetOps(table.organizationId),
      }),
    ],
  )
  .enableRLS();

/** Maintenance tickets - manager/dispatcher-managed, tenant-readable. */
export const maintenanceTickets = app
  .table(
    "maintenance_tickets",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      vehicleId: uuid("vehicle_id")
        .notNull()
        .references(() => fleetVehicles.id),
      // Free text - real maintenance vocabulary is unconfirmed, same guardrail
      // as drivers.premblyStatus.
      category: text("category").notNull(),
      severity: maintenanceSeverity("severity").notNull().default("medium"),
      status: maintenanceStatus("status").notNull().default("open"),
      title: text("title").notNull(),
      notes: text("notes"),
      openedByUserId: uuid("opened_by_user_id")
        .notNull()
        .references(() => authUsers.id),
      openedAt: timestamp("opened_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      resolvedByUserId: uuid("resolved_by_user_id").references(
        () => authUsers.id,
      ),
      resolvedAt: timestamp("resolved_at", { withTimezone: true }),
      ...timestamps(),
    },
    (table) => [
      check(
        "maintenance_title_not_blank",
        sql`char_length(btrim(${table.title})) > 0`,
      ),
      index("maintenance_org_status_idx").on(
        table.organizationId,
        table.status,
      ),
      index("maintenance_vehicle_idx").on(table.vehicleId),

      pgPolicy("tenant and staff can select maintenance tickets", {
        for: "select",
        to: authenticatedRole,
        using: canViewOrg(table.organizationId),
      }),
      pgPolicy("managers and staff can insert maintenance tickets", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`${canManageFleetOps(table.organizationId)}
          and exists (
            select 1 from ${fleetVehicles} v
            where v.id = ${table.vehicleId} and v.organization_id = ${table.organizationId}
          )`,
      }),
      pgPolicy("managers and staff can update maintenance tickets", {
        for: "update",
        to: authenticatedRole,
        using: canManageFleetOps(table.organizationId),
        withCheck: canManageFleetOps(table.organizationId),
      }),
    ],
  )
  .enableRLS();
