import { isPaystackLive } from "@hoc/integrations/paystack";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { SiteHeader } from "@/components/ui/site-header";
import { StickySummary } from "@/components/ui/sticky-summary";
import { formatMoney } from "@/lib/money";
import { getServerCaller } from "@/server/trpc/caller";

import { acceptOrderTerms, payForOrder } from "./actions";

export const metadata: Metadata = {
  description: "Order summary and payment status.",
  title: "Order",
};

const statusVariant = {
  balance_pending: "selected",
  cancelled: "inactive",
  deposit_paid: "selected",
  deposit_pending: "selected",
  draft: "neutral",
  paid_in_full: "live",
} as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const caller = await getServerCaller();
  const result = await caller.orders.getById({ id: orderId });
  if (!result) notFound();

  const { order, payments } = result;
  const paymentKindDue =
    order.status === "deposit_pending"
      ? "deposit"
      : order.status === "balance_pending"
        ? "balance"
        : null;

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Order
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
              Fleet order
            </h1>
            <Chip variant={statusVariant[order.status]}>
              {order.status.replace(/_/g, " ")}
            </Chip>
          </div>
          <p className="mt-6 max-w-[52ch] text-sm leading-6 text-contrast-high">
            {order.pricingNote || "No pricing note recorded."}
          </p>

          {order.status === "paid_in_full" ? (
            <div className="mt-8 rounded-card border border-contrast-low bg-surface p-6">
              <p className="font-semibold">Your fleet is provisioned.</p>
              <p className="mt-2 max-w-[52ch] text-sm leading-6 text-contrast-medium">
                Manage your drivers, vehicles, and live assignments from your Owner
                Space.
              </p>
              <ButtonLink className="mt-5 w-full sm:w-auto" href="/space" variant="signal">
                Open workspace
              </ButtonLink>
            </div>
          ) : null}

          <div className="mt-10">
            <p className="text-sm font-semibold">Payments</p>
            {payments.length > 0 ? (
              <div className="mt-4">
                <DataTable
                  caption="Payments for this order"
                  columns={[
                    { key: "kind", label: "Kind" },
                    { align: "right", key: "amount", label: "Amount" },
                    { key: "status", label: "Status" },
                    { key: "date", label: "Date" },
                  ]}
                  rows={payments.map((payment) => ({
                    id: payment.id,
                    values: {
                      amount: formatMoney(payment.amountMinor, payment.currency),
                      date: new Date(payment.createdAt).toLocaleString(),
                      kind: payment.kind,
                      status: payment.status,
                    },
                  }))}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-contrast-medium">No payment attempts yet.</p>
            )}
          </div>
        </header>

        <div className="min-w-0 lg:col-span-4 lg:col-start-9">
          <StickySummary
            action={
              paymentKindDue ? (
                !order.termsAcceptedAt ? (
                  <form action={acceptOrderTerms} className="grid gap-4">
                    <input name="orderId" type="hidden" value={order.id} />
                    <Checkbox
                      description="Placeholder terms copy, pending HOC legal review."
                      id="terms"
                      label="I accept the order terms"
                      name="terms"
                      required
                    />
                    <Button className="w-full" type="submit" variant="signal">
                      Accept terms
                    </Button>
                  </form>
                ) : isPaystackLive() ? (
                  <form action={payForOrder}>
                    <input name="orderId" type="hidden" value={order.id} />
                    <input name="kind" type="hidden" value={paymentKindDue} />
                    <Button className="w-full" type="submit" variant="signal">
                      Pay {paymentKindDue}
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-contrast-medium">
                    Online payment isn&apos;t available yet - contact HOC staff to
                    complete this payment.
                  </p>
                )
              ) : undefined
            }
            heading="Order summary"
            rows={[
              { label: "Total", value: formatMoney(order.totalMinor, order.currency) },
              {
                label: "Deposit",
                value: formatMoney(order.depositMinor, order.currency),
              },
              {
                label: "Balance",
                value: formatMoney(
                  order.totalMinor - order.depositMinor,
                  order.currency,
                ),
              },
              {
                label: "Terms accepted",
                value: order.termsAcceptedAt
                  ? new Date(order.termsAcceptedAt).toLocaleDateString()
                  : "Not yet",
              },
            ]}
          />
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
