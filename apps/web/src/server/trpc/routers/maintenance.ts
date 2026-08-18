import {
  openMaintenanceTicketSchema,
  updateMaintenanceTicketSchema,
} from "@hoc/contracts";
import { fleetVehicles, maintenanceTickets } from "@hoc/db";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { assertCanManageFleetOps } from "../authz";
import { writeAuditLog } from "@/server/audit/log";

import { protectedProcedure, router } from "../trpc";

/** Milestone 9 - maintenance tickets. Manager-managed, tenant-readable (RLS). */
export const maintenanceRouter = router({
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select({ ticket: maintenanceTickets, vehicle: fleetVehicles })
          .from(maintenanceTickets)
          .innerJoin(fleetVehicles, eq(fleetVehicles.id, maintenanceTickets.vehicleId))
          .where(eq(maintenanceTickets.organizationId, input.organizationId))
          .orderBy(desc(maintenanceTickets.openedAt)),
      ),
    ),

  open: protectedProcedure
    .input(openMaintenanceTicketSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        await assertCanManageFleetOps(tx, { organizationId: input.organizationId });

        const [ticket] = await tx
          .insert(maintenanceTickets)
          .values({
            organizationId: input.organizationId,
            vehicleId: input.vehicleId,
            category: input.category,
            severity: input.severity,
            title: input.title,
            notes: input.notes,
            openedByUserId: ctx.userId,
          })
          .returning();

        await writeAuditLog(tx, {
          action: "maintenance_ticket.open",
          actorUserId: ctx.userId,
          afterData: ticket,
          entityId: ticket.id,
          entityType: "maintenance_ticket",
          organizationId: input.organizationId,
        });

        return ticket;
      });
    }),

  update: protectedProcedure
    .input(updateMaintenanceTicketSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [existing] = await tx
          .select()
          .from(maintenanceTickets)
          .where(eq(maintenanceTickets.id, input.ticketId));
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        await assertCanManageFleetOps(tx, {
          organizationId: existing.organizationId,
        });

        // Stamp resolvedAt/By only on the transition INTO resolved; a
        // subsequent edit of an already-resolved ticket keeps the original
        // resolution, and moving away from resolved clears it.
        const wasResolved = existing.status === "resolved";
        const resolving = input.status === "resolved";
        const [updated] = await tx
          .update(maintenanceTickets)
          .set({
            status: input.status,
            notes: input.notes ?? existing.notes,
            resolvedByUserId: resolving
              ? wasResolved
                ? existing.resolvedByUserId
                : ctx.userId
              : null,
            resolvedAt: resolving
              ? wasResolved
                ? existing.resolvedAt
                : new Date()
              : null,
            updatedAt: new Date(),
          })
          .where(eq(maintenanceTickets.id, input.ticketId))
          .returning();

        await writeAuditLog(tx, {
          action: "maintenance_ticket.update",
          actorUserId: ctx.userId,
          afterData: updated,
          beforeData: existing,
          entityId: input.ticketId,
          entityType: "maintenance_ticket",
          organizationId: existing.organizationId,
        });

        return updated;
      });
    }),
});
