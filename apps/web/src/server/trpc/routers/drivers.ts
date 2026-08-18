import {
  createDriverSchema,
  membershipStatusSchema,
  setDriverOperationalStatusSchema,
  setDriverPhotoPathSchema,
  updateDriverStatusSchema,
} from "@hoc/contracts";
import { drivers, organizations } from "@hoc/db";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { assertCanManageFleetOps } from "../authz";
import { writeAuditLog } from "@/server/audit/log";
import { assertWithinRateLimit } from "@/server/security/rate-limit";

import { protectedProcedure, router, staffProcedure } from "../trpc";

export type DispatchDriver = {
  id: string;
  displayName: string;
  operationalStatus: string;
  lat: number;
  lng: number;
  lastSeenAt: Date | null;
};

export const driversRouter = router({
  create: protectedProcedure.input(createDriverSchema).mutation(async ({ ctx, input }) => {
    return ctx.withRLS(async (tx) => {
      await assertCanManageFleetOps(tx, { organizationId: input.organizationId });
      await assertWithinRateLimit(tx, {
        key: `driver-create:${ctx.userId}`,
        maxAttempts: 20,
        windowSeconds: 60,
      });

      const [driver] = await tx
        .insert(drivers)
        .values({
          createdByUserId: ctx.userId,
          displayName: input.displayName,
          licenceReference: input.licenceReference,
          organizationId: input.organizationId,
          phone: input.phone,
        })
        .returning();

      await writeAuditLog(tx, {
        action: "driver.create",
        actorUserId: ctx.userId,
        afterData: driver,
        entityId: driver.id,
        entityType: "driver",
        organizationId: input.organizationId,
      });

      return driver;
    });
  }),

  updateStatus: protectedProcedure
    .input(updateDriverStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [existing] = await tx
          .select()
          .from(drivers)
          .where(eq(drivers.id, input.driverId));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        await assertCanManageFleetOps(tx, { organizationId: existing.organizationId });

        const [updated] = await tx
          .update(drivers)
          .set({ status: input.status })
          .where(eq(drivers.id, input.driverId))
          .returning();

        await writeAuditLog(tx, {
          action: "driver.update_status",
          actorUserId: ctx.userId,
          afterData: updated,
          beforeData: existing,
          entityId: input.driverId,
          entityType: "driver",
          organizationId: existing.organizationId,
        });

        return updated;
      });
    }),

  setOperationalStatus: protectedProcedure
    .input(setDriverOperationalStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [existing] = await tx
          .select()
          .from(drivers)
          .where(eq(drivers.id, input.driverId));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        await assertCanManageFleetOps(tx, {
          organizationId: existing.organizationId,
        });

        // lastSeenAt reflects location freshness, set only by the location-
        // ingestion path (M9b); a manager toggling availability is not a
        // location update.
        const [updated] = await tx
          .update(drivers)
          .set({
            operationalStatus: input.operationalStatus,
            updatedAt: new Date(),
          })
          .where(eq(drivers.id, input.driverId))
          .returning();

        await writeAuditLog(tx, {
          action: "driver.set_operational_status",
          actorUserId: ctx.userId,
          afterData: { operationalStatus: updated.operationalStatus },
          beforeData: { operationalStatus: existing.operationalStatus },
          entityId: input.driverId,
          entityType: "driver",
          organizationId: existing.organizationId,
        });

        return { operationalStatus: updated.operationalStatus };
      });
    }),

  setPhotoPath: protectedProcedure
    .input(setDriverPhotoPathSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [existing] = await tx
          .select()
          .from(drivers)
          .where(eq(drivers.id, input.driverId));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        await assertCanManageFleetOps(tx, {
          organizationId: existing.organizationId,
        });

        const [updated] = await tx
          .update(drivers)
          .set({ photoPath: input.photoPath, updatedAt: new Date() })
          .where(eq(drivers.id, input.driverId))
          .returning();

        await writeAuditLog(tx, {
          action: "driver.set_photo",
          actorUserId: ctx.userId,
          afterData: { photoPath: updated.photoPath },
          beforeData: { photoPath: existing.photoPath },
          entityId: input.driverId,
          entityType: "driver",
          organizationId: existing.organizationId,
        });

        return { photoPath: updated.photoPath };
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [driver] = await ctx.withRLS((tx) =>
        tx.select().from(drivers).where(eq(drivers.id, input.id)),
      );
      return driver ?? null;
    }),

  // Dispatch view: drivers with their location projected to {lat,lng} (never
  // the raw geography column) + operational status, for the live map.
  listForDispatch: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx.execute<DispatchDriver>(sql`
          select
            d.id,
            d.display_name as "displayName",
            d.operational_status::text as "operationalStatus",
            gis.st_y(d.current_location::gis.geometry) as lat,
            gis.st_x(d.current_location::gis.geometry) as lng,
            d.last_seen_at as "lastSeenAt"
          from app.drivers d
          where d.organization_id = ${input.organizationId}
            and d.current_location is not null
          order by d.display_name
        `),
      ),
    ),

  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select()
          .from(drivers)
          .where(eq(drivers.organizationId, input.organizationId))
          .orderBy(desc(drivers.createdAt)),
      ),
    ),

  listAll: staffProcedure
    .input(z.object({ status: membershipStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const status = input?.status;
      return ctx.withRLS((tx) =>
        status
          ? tx
              .select({ driver: drivers, organizationName: organizations.name })
              .from(drivers)
              .innerJoin(organizations, eq(organizations.id, drivers.organizationId))
              .where(eq(drivers.status, status))
              .orderBy(desc(drivers.createdAt))
          : tx
              .select({ driver: drivers, organizationName: organizations.name })
              .from(drivers)
              .innerJoin(organizations, eq(organizations.id, drivers.organizationId))
              .orderBy(desc(drivers.createdAt)),
      );
    }),
});
