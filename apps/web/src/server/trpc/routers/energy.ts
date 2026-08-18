import { logChargingSessionSchema } from "@hoc/contracts";
import { chargingSessions, fleetVehicles } from "@hoc/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { assertCanManageFleetOps } from "../authz";
import { writeAuditLog } from "@/server/audit/log";

import { protectedProcedure, router } from "../trpc";

/**
 * Milestone 9 - charging / energy. Manager-managed, tenant-readable (RLS).
 * Cost is stored in integer minor units with an explicit currency, never a
 * float; the contract and the DB check both require currency alongside cost.
 */
export const energyRouter = router({
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select({ session: chargingSessions, vehicle: fleetVehicles })
          .from(chargingSessions)
          .innerJoin(fleetVehicles, eq(fleetVehicles.id, chargingSessions.vehicleId))
          .where(eq(chargingSessions.organizationId, input.organizationId))
          .orderBy(desc(chargingSessions.startedAt)),
      ),
    ),

  log: protectedProcedure
    .input(logChargingSessionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        await assertCanManageFleetOps(tx, { organizationId: input.organizationId });

        const [session] = await tx
          .insert(chargingSessions)
          .values({
            organizationId: input.organizationId,
            vehicleId: input.vehicleId,
            driverId: input.driverId,
            locationLabel: input.locationLabel,
            energyWh: input.energyWh,
            costMinor: input.costMinor,
            currency: input.currency,
            status: "completed",
            createdByUserId: ctx.userId,
          })
          .returning();

        await writeAuditLog(tx, {
          action: "charging_session.log",
          actorUserId: ctx.userId,
          afterData: session,
          entityId: session.id,
          entityType: "charging_session",
          organizationId: input.organizationId,
        });

        return session;
      });
    }),
});
