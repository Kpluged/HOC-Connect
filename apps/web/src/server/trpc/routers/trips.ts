import {
  assignTripSchema,
  createTripSchema,
  transitionTripSchema,
} from "@hoc/contracts";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { assertCanManageFleetOps } from "../authz";
import { assertWithinRateLimit } from "@/server/security/rate-limit";
import type { RLSTransaction } from "@/server/db/with-rls";

import { protectedProcedure, router } from "../trpc";

/**
 * Milestone 9 - dispatch. Every write goes through the SECURITY DEFINER
 * lifecycle functions (app.create_trip / app.assign_trip / app.transition_trip)
 * installed by migration 0021; those functions own the state-machine
 * validation, the trip_events + audit_logs append, and the realtime broadcast.
 * This router adds a clean FORBIDDEN pre-check (assertCanManageFleetOps) and
 * rate limiting on top, then calls the function - it never touches trip columns
 * directly. Geography is always projected to {lat,lng} on read; the raw
 * geography column never crosses the transport boundary.
 */

export type TripRow = {
  id: string;
  status: string;
  source: string;
  pickupLabel: string;
  dropoffLabel: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverId: string | null;
  vehicleId: string | null;
  requestedAt: Date;
  assignedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

export type DispatchTrip = TripRow & {
  driverName: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  isDemo: boolean;
};

export type NearestDriver = {
  id: string;
  displayName: string;
  lat: number;
  lng: number;
  distanceMeters: number;
};

// Reusable projection of a single trip row returned by a lifecycle function.
const tripReturning = sql`
  t.id,
  t.status::text as status,
  t.source::text as source,
  t.pickup_label as "pickupLabel",
  t.dropoff_label as "dropoffLabel",
  gis.st_y(t.pickup::gis.geometry) as "pickupLat",
  gis.st_x(t.pickup::gis.geometry) as "pickupLng",
  gis.st_y(t.dropoff::gis.geometry) as "dropoffLat",
  gis.st_x(t.dropoff::gis.geometry) as "dropoffLng",
  t.driver_id as "driverId",
  t.vehicle_id as "vehicleId",
  t.requested_at as "requestedAt",
  t.assigned_at as "assignedAt",
  t.started_at as "startedAt",
  t.completed_at as "completedAt",
  t.cancelled_at as "cancelledAt"
`;

async function tripOrganizationId(tx: RLSTransaction, tripId: string) {
  const [row] = await tx.execute<{ organizationId: string }>(
    sql`select organization_id as "organizationId" from app.trips where id = ${tripId}`,
  );
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
  return row.organizationId;
}

export const tripsRouter = router({
  create: protectedProcedure
    .input(createTripSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        await assertCanManageFleetOps(tx, { organizationId: input.organizationId });
        await assertWithinRateLimit(tx, {
          key: `trip-create:${ctx.userId}`,
          maxAttempts: 30,
          windowSeconds: 60,
        });

        const [trip] = await tx.execute<TripRow>(sql`
          select ${tripReturning}
          from app.create_trip(
            ${input.organizationId}, ${input.pickupLabel},
            ${input.pickup.lng}, ${input.pickup.lat},
            ${input.dropoffLabel}, ${input.dropoff.lng}, ${input.dropoff.lat},
            ${input.source ?? "manual"}
          ) t
        `);
        return trip;
      });
    }),

  assign: protectedProcedure
    .input(assignTripSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const organizationId = await tripOrganizationId(tx, input.tripId);
        await assertCanManageFleetOps(tx, { organizationId });
        await assertWithinRateLimit(tx, {
          key: `trip-assign:${ctx.userId}`,
          maxAttempts: 40,
          windowSeconds: 60,
        });

        const [trip] = await tx.execute<TripRow>(sql`
          select ${tripReturning}
          from app.assign_trip(${input.tripId}, ${input.driverId}, ${input.vehicleId}) t
        `);
        return trip;
      });
    }),

  transition: protectedProcedure
    .input(transitionTripSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const organizationId = await tripOrganizationId(tx, input.tripId);
        await assertCanManageFleetOps(tx, { organizationId });
        await assertWithinRateLimit(tx, {
          key: `trip-transition:${ctx.userId}`,
          maxAttempts: 60,
          windowSeconds: 60,
        });

        const [trip] = await tx.execute<TripRow>(sql`
          select ${tripReturning}
          from app.transition_trip(${input.tripId}, ${input.next}::app.trip_status) t
        `);
        return trip;
      });
    }),

  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx.execute<DispatchTrip>(sql`
          select
            t.id,
            t.status::text as status,
            t.source::text as source,
            t.pickup_label as "pickupLabel",
            t.dropoff_label as "dropoffLabel",
            gis.st_y(t.pickup::gis.geometry) as "pickupLat",
            gis.st_x(t.pickup::gis.geometry) as "pickupLng",
            gis.st_y(t.dropoff::gis.geometry) as "dropoffLat",
            gis.st_x(t.dropoff::gis.geometry) as "dropoffLng",
            t.driver_id as "driverId",
            d.display_name as "driverName",
            t.vehicle_id as "vehicleId",
            v.vehicle_model_slug as "vehicleModel",
            v.plate as "vehiclePlate",
            t.requested_at as "requestedAt",
            t.assigned_at as "assignedAt",
            t.started_at as "startedAt",
            t.completed_at as "completedAt",
            t.cancelled_at as "cancelledAt",
            (t.rider_ref = 'DEMO') as "isDemo"
          from app.trips t
          left join app.drivers d on d.id = t.driver_id
          left join app.vehicles v on v.id = t.vehicle_id
          where t.organization_id = ${input.organizationId}
          order by
            (case when t.status in ('completed', 'cancelled') then 1 else 0 end),
            t.requested_at desc
        `),
      ),
    ),

  // Tenant-scoped nearest-driver KNN (architecture doc §6): available drivers
  // with a known location, ordered by the PostGIS <-> operator against pickup.
  nearestDrivers: protectedProcedure
    .input(
      z.object({
        organizationId: z.uuid(),
        pickup: z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        }),
        limit: z.number().int().min(1).max(20).optional(),
      }),
    )
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx.execute<NearestDriver>(sql`
          select
            d.id,
            d.display_name as "displayName",
            gis.st_y(d.current_location::gis.geometry) as lat,
            gis.st_x(d.current_location::gis.geometry) as lng,
            gis.st_distance(
              d.current_location,
              gis.st_setsrid(gis.st_makepoint(${input.pickup.lng}, ${input.pickup.lat}), 4326)::gis.geography
            ) as "distanceMeters"
          from app.drivers d
          where d.organization_id = ${input.organizationId}
            and d.operational_status = 'available'
            and d.current_location is not null
          order by d.current_location operator(gis.<->)
            gis.st_setsrid(gis.st_makepoint(${input.pickup.lng}, ${input.pickup.lat}), 4326)::gis.geography
          limit ${input.limit ?? 5}
        `),
      ),
    ),
});
