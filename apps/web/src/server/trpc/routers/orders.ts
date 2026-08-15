import { createOrderSchema, orderStatusSchema, paymentKindSchema } from "@hoc/contracts";
import { applications, orders, payments } from "@hoc/db";
import { getPaystackAdapter } from "@hoc/integrations/paystack";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { protectedProcedure, router, staffProcedure } from "../trpc";

async function getOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export const ordersRouter = router({
  acceptTerms: protectedProcedure
    .input(z.object({ orderId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.withRLS((tx) =>
        tx
          .update(orders)
          .set({ termsAcceptedAt: new Date(), termsAcceptedByUserId: ctx.userId })
          .where(
            and(eq(orders.id, input.orderId), eq(orders.status, "deposit_pending")),
          )
          .returning(),
      );

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  cancel: staffProcedure
    .input(z.object({ orderId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.withRLS((tx) =>
        tx
          .update(orders)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(orders.id, input.orderId),
              inArray(orders.status, ["draft", "deposit_pending"]),
            ),
          )
          .returning(),
      );

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  createForApplication: staffProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.depositMinor > input.totalMinor) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deposit cannot exceed the order total.",
        });
      }

      return ctx.withRLS(async (tx) => {
        const [application] = await tx
          .select()
          .from(applications)
          .where(eq(applications.id, input.applicationId));

        if (!application) throw new TRPCError({ code: "NOT_FOUND" });
        if (application.status !== "approved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only an approved application can be converted into an order.",
          });
        }

        const [existing] = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(
            and(
              eq(orders.applicationId, input.applicationId),
              ne(orders.status, "cancelled"),
            ),
          );

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This application already has an active order.",
          });
        }

        const [order] = await tx
          .insert(orders)
          .values({
            applicationId: input.applicationId,
            createdByUserId: ctx.userId,
            currency: input.currency,
            depositMinor: input.depositMinor,
            organizationId: application.organizationId,
            pricingNote: input.pricingNote,
            totalMinor: input.totalMinor,
          })
          .returning();

        return order;
      });
    }),

  finalize: staffProcedure
    .input(z.object({ orderId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.withRLS((tx) =>
        tx
          .update(orders)
          .set({ status: "deposit_pending" })
          .where(and(eq(orders.id, input.orderId), eq(orders.status, "draft")))
          .returning(),
      );

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  getByApplicationId: protectedProcedure
    .input(z.object({ applicationId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.withRLS((tx) =>
        tx
          .select()
          .from(orders)
          .where(eq(orders.applicationId, input.applicationId))
          .orderBy(desc(orders.createdAt)),
      );
      return order ?? null;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.withRLS(async (tx) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, input.id));
        if (!order) return null;

        const orderPayments = await tx
          .select()
          .from(payments)
          .where(eq(payments.orderId, input.id))
          .orderBy(desc(payments.createdAt));

        return { order, payments: orderPayments };
      });
    }),

  initiatePayment: protectedProcedure
    .input(z.object({ kind: paymentKindSchema, orderId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const email = ctx.email;
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No email on file for this account.",
        });
      }

      const { order, payment } = await ctx.withRLS(async (tx) => {
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId));

        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (!order.termsAcceptedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order terms must be accepted before paying.",
          });
        }

        const expectedStatus =
          input.kind === "deposit" ? "deposit_pending" : "balance_pending";
        if (order.status !== expectedStatus) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `This order is not awaiting a ${input.kind} payment.`,
          });
        }

        const [existingSucceeded] = await tx
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.orderId, order.id),
              eq(payments.kind, input.kind),
              eq(payments.status, "succeeded"),
            ),
          );

        if (existingSucceeded) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `The ${input.kind} for this order has already been paid.`,
          });
        }

        const amountMinor =
          input.kind === "deposit" ? order.depositMinor : order.totalMinor - order.depositMinor;

        const [payment] = await tx
          .insert(payments)
          .values({
            amountMinor,
            currency: order.currency,
            initiatedByUserId: ctx.userId,
            kind: input.kind,
            orderId: order.id,
            organizationId: order.organizationId,
            providerReference: `pay_${crypto.randomUUID()}`,
            status: "pending",
          })
          .returning();

        return { order, payment };
      });

      // Outside the transaction - never hold one open across external I/O,
      // same discipline applications.submit already established for
      // Prembly.
      const origin = await getOrigin();
      const transaction = await getPaystackAdapter().initializeTransaction({
        amountMinor: payment.amountMinor,
        callbackUrl: `${origin}/orders/${order.id}`,
        currency: payment.currency,
        email,
        reference: payment.providerReference,
      });

      return { authorizationUrl: transaction.authorizationUrl };
    }),

  listForReview: staffProcedure
    .input(z.object({ status: orderStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const status = input?.status;
      return ctx.withRLS((tx) =>
        status
          ? tx
              .select()
              .from(orders)
              .where(eq(orders.status, status))
              .orderBy(desc(orders.createdAt))
          : tx.select().from(orders).orderBy(desc(orders.createdAt)),
      );
    }),

  updateTotals: staffProcedure
    .input(
      z.object({
        currency: createOrderSchema.shape.currency,
        depositMinor: createOrderSchema.shape.depositMinor,
        orderId: z.uuid(),
        pricingNote: createOrderSchema.shape.pricingNote,
        totalMinor: createOrderSchema.shape.totalMinor,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.depositMinor > input.totalMinor) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deposit cannot exceed the order total.",
        });
      }

      const [updated] = await ctx.withRLS((tx) =>
        tx
          .update(orders)
          .set({
            currency: input.currency,
            depositMinor: input.depositMinor,
            pricingNote: input.pricingNote,
            totalMinor: input.totalMinor,
          })
          .where(and(eq(orders.id, input.orderId), eq(orders.status, "draft")))
          .returning(),
      );

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),
});
