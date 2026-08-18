import { assignVehicleSchema, endShiftSchema } from "@hoc/contracts";
import { drivers, fleetVehicles, shifts } from "@hoc/db";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { assertCanManageFleetOps } from "../authz";
import { writeAuditLog } from "@/server/audit/log";
import { assertWithinRateLimit } from "@/server/security/rate-limit";

import { protectedProcedure, router } from "../trpc";

export const shiftsRouter = router({
  assign: protectedProcedure.input(assignVehicleSchema).mutation(async ({ ctx, input }) => {
    return ctx.withRLS(async (tx) => {
      await assertCanManageFleetOps(tx, { organizationId: input.organizationId });
      await assertWithinRateLimit(tx, {
        key: `shift-assign:${ctx.userId}`,
        maxAttempts: 20,
        windowSeconds: 60,
      });

      // Close any shift this driver or this vehicle is currently on -
      // the partial unique indexes only allow one active shift per
      // driver and per vehicle, so reassignment means closing the old
      // one first.
      await tx
        .update(shifts)
        .set({ endedAt: new Date(), endedByUserId: ctx.userId })
        .where(and(eq(shifts.driverId, input.driverId), isNull(shifts.endedAt)));
      await tx
        .update(shifts)
        .set({ endedAt: new Date(), endedByUserId: ctx.userId })
        .where(and(eq(shifts.vehicleId, input.vehicleId), isNull(shifts.endedAt)));

      const [shift] = await tx
        .insert(shifts)
        .values({
          createdByUserId: ctx.userId,
          driverId: input.driverId,
          organizationId: input.organizationId,
          vehicleId: input.vehicleId,
        })
        .returning();

      await writeAuditLog(tx, {
        action: "shift.assign",
        actorUserId: ctx.userId,
        afterData: shift,
        entityId: shift.id,
        entityType: "shift",
        organizationId: input.organizationId,
      });

      return shift;
    });
  }),

  end: protectedProcedure.input(endShiftSchema).mutation(async ({ ctx, input }) => {
    return ctx.withRLS(async (tx) => {
      const [existing] = await tx.select().from(shifts).where(eq(shifts.id, input.shiftId));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await assertCanManageFleetOps(tx, { organizationId: existing.organizationId });

      const [updated] = await tx
        .update(shifts)
        .set({ endedAt: new Date(), endedByUserId: ctx.userId })
        .where(and(eq(shifts.id, input.shiftId), isNull(shifts.endedAt)))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

      await writeAuditLog(tx, {
        action: "shift.end",
        actorUserId: ctx.userId,
        afterData: updated,
        beforeData: existing,
        entityId: input.shiftId,
        entityType: "shift",
        organizationId: existing.organizationId,
      });

      return updated;
    });
  }),

  listActiveByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select({ driver: drivers, shift: shifts, vehicle: fleetVehicles })
          .from(shifts)
          .innerJoin(drivers, eq(drivers.id, shifts.driverId))
          .innerJoin(fleetVehicles, eq(fleetVehicles.id, shifts.vehicleId))
          .where(and(eq(shifts.organizationId, input.organizationId), isNull(shifts.endedAt)))
          .orderBy(desc(shifts.startedAt)),
      ),
    ),

  listByDriver: protectedProcedure
    .input(z.object({ driverId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select()
          .from(shifts)
          .where(eq(shifts.driverId, input.driverId))
          .orderBy(desc(shifts.startedAt)),
      ),
    ),

  listByVehicle: protectedProcedure
    .input(z.object({ vehicleId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select()
          .from(shifts)
          .where(eq(shifts.vehicleId, input.vehicleId))
          .orderBy(desc(shifts.startedAt)),
      ),
    ),
});
