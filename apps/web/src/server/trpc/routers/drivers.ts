import {
  createDriverSchema,
  membershipStatusSchema,
  updateDriverStatusSchema,
} from "@hoc/contracts";
import { drivers, organizations } from "@hoc/db";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { assertCanManageFleetOps } from "../authz";
import { writeAuditLog } from "@/server/audit/log";
import { assertWithinRateLimit } from "@/server/security/rate-limit";

import { protectedProcedure, router, staffProcedure } from "../trpc";

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

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [driver] = await ctx.withRLS((tx) =>
        tx.select().from(drivers).where(eq(drivers.id, input.id)),
      );
      return driver ?? null;
    }),

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
