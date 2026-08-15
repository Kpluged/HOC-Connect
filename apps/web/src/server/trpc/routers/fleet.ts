import { allocateVehicleSchema, vehicleLifecycleStatusSchema } from "@hoc/contracts";
import { fleetVehicles, orders, organizations } from "@hoc/db";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router, staffProcedure } from "../trpc";

export const fleetRouter = router({
  activate: staffProcedure
    .input(z.object({ vehicleId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.withRLS((tx) =>
        tx
          .update(fleetVehicles)
          .set({ activatedAt: new Date(), status: "active" })
          .where(
            and(eq(fleetVehicles.id, input.vehicleId), eq(fleetVehicles.status, "delivered")),
          )
          .returning(),
      );
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  allocate: staffProcedure.input(allocateVehicleSchema).mutation(async ({ ctx, input }) => {
    return ctx.withRLS(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId));
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.status !== "paid_in_full") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vehicles can only be allocated once an order is paid in full.",
        });
      }

      const [existingVin] = await tx
        .select({ id: fleetVehicles.id })
        .from(fleetVehicles)
        .where(eq(fleetVehicles.vin, input.vin));
      if (existingVin) {
        throw new TRPCError({ code: "CONFLICT", message: "This VIN has already been allocated." });
      }

      const [vehicle] = await tx
        .insert(fleetVehicles)
        .values({
          allocatedByUserId: ctx.userId,
          orderId: order.id,
          organizationId: order.organizationId,
          plate: input.plate,
          vehicleModelSlug: input.vehicleModelSlug,
          vin: input.vin,
        })
        .returning();
      return vehicle;
    });
  }),

  listAll: staffProcedure
    .input(z.object({ status: vehicleLifecycleStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const status = input?.status;
      return ctx.withRLS((tx) =>
        status
          ? tx
              .select({ organizationName: organizations.name, vehicle: fleetVehicles })
              .from(fleetVehicles)
              .innerJoin(organizations, eq(organizations.id, fleetVehicles.organizationId))
              .where(eq(fleetVehicles.status, status))
              .orderBy(desc(fleetVehicles.createdAt))
          : tx
              .select({ organizationName: organizations.name, vehicle: fleetVehicles })
              .from(fleetVehicles)
              .innerJoin(organizations, eq(organizations.id, fleetVehicles.organizationId))
              .orderBy(desc(fleetVehicles.createdAt)),
      );
    }),

  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.withRLS((tx) =>
        tx
          .select()
          .from(fleetVehicles)
          .where(eq(fleetVehicles.organizationId, input.organizationId))
          .orderBy(desc(fleetVehicles.createdAt)),
      ),
    ),

  markDelivered: staffProcedure
    .input(z.object({ vehicleId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.withRLS((tx) =>
        tx
          .update(fleetVehicles)
          .set({ deliveredAt: new Date(), status: "delivered" })
          .where(
            and(eq(fleetVehicles.id, input.vehicleId), eq(fleetVehicles.status, "allocated")),
          )
          .returning(),
      );
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),
});
