import { organizations, orders, payments } from "@hoc/db";
import { getPaystackAdapter } from "@hoc/integrations/paystack";
import { and, eq } from "drizzle-orm";

import { runAsServiceRole } from "@/server/db/with-service-role";

type PaystackWebhookPayload = {
  data?: { reference?: string };
  event?: string;
};

/**
 * Unauthenticated provider callback - not a tRPC procedure, no user
 * session. verifyWebhookSignature always returns false in stub mode
 * (packages/integrations/src/paystack/stub.ts), so this 401s all traffic
 * until a live.ts adapter exists - an explicit, disclosed coverage gap,
 * not a silently skipped one. Every DB write below is scoped to a
 * uniquely-matched row so a redelivered event safely no-ops.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  const adapter = getPaystackAdapter();
  if (!adapter.verifyWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: PaystackWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (event.event !== "charge.success") {
    return new Response(null, { status: 200 });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return new Response(null, { status: 200 });
  }

  // Never trust the webhook payload alone - re-verify server-to-server.
  const verification = await adapter.verifyTransaction(reference);
  if (verification.status !== "success") {
    return new Response(null, { status: 200 });
  }

  await runAsServiceRole(async (tx) => {
    const [payment] = await tx
      .update(payments)
      .set({ status: "succeeded" })
      .where(
        and(eq(payments.providerReference, reference), eq(payments.status, "pending")),
      )
      .returning();

    // 0 rows: unknown reference, or already processed by an earlier
    // delivery of this same event - either way, nothing left to do.
    if (!payment) return;

    const [order] = await tx.select().from(orders).where(eq(orders.id, payment.orderId));
    if (!order) return;

    // No staff gate between deposit and balance (confirmed M6 decision) -
    // a successful deposit payment moves straight to balance_pending
    // (or paid_in_full if the deposit happened to cover the full total),
    // skipping the deposit_paid resting state entirely.
    const remainderMinor = order.totalMinor - order.depositMinor;
    const nextStatus =
      payment.kind === "deposit"
        ? remainderMinor <= 0
          ? "paid_in_full"
          : "balance_pending"
        : "paid_in_full";
    const expectedCurrentStatus =
      payment.kind === "deposit" ? "deposit_pending" : "balance_pending";

    const [updatedOrder] = await tx
      .update(orders)
      .set({ status: nextStatus })
      .where(and(eq(orders.id, order.id), eq(orders.status, expectedCurrentStatus)))
      .returning();

    if (updatedOrder && nextStatus === "paid_in_full") {
      await tx
        .update(organizations)
        .set({ status: "live" })
        .where(
          and(
            eq(organizations.id, order.organizationId),
            eq(organizations.status, "approved"),
          ),
        );
    }
  });

  return new Response(null, { status: 200 });
}
