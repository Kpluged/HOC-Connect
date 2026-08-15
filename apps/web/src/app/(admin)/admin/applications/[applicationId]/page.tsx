import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { StaffOnlyNotice } from "@/components/admin/staff-only-notice";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { Field, SelectField } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { StickySummary } from "@/components/ui/sticky-summary";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerCaller } from "@/server/trpc/caller";

import { addStaffNote, decideApplication } from "../actions";
import {
  cancelOrder,
  createOrder,
  finalizeOrder,
  updateOrderTotals,
} from "../order-actions";

export const metadata: Metadata = {
  description: "Review a fleet application: documents, verification, and decision.",
  title: "Application review",
};

const statusVariant = {
  approved: "live",
  declined: "inactive",
  draft: "neutral",
  submitted: "selected",
  under_review: "selected",
} as const;

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const caller = await getServerCaller();

  let result;
  try {
    result = await caller.applications.getByIdForStaff({ id: applicationId });
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "FORBIDDEN" || error.code === "UNAUTHORIZED")) {
      return (
        <main className="min-h-dvh bg-canvas" data-room="light">
          <SiteHeader />
          <section className="page-shell py-16 lg:py-24">
            <StaffOnlyNotice />
          </section>
          <MarketingFooter />
        </main>
      );
    }
    throw error;
  }

  if (!result) notFound();
  const { application, documents, notes } = result;

  const supabase = await createSupabaseServerClient();
  const documentLinks = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(doc.storagePath, 60 * 10);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );

  const isDecided = application.status === "approved" || application.status === "declined";

  const order =
    application.status === "approved"
      ? await caller.orders.getByApplicationId({ applicationId: application.id })
      : null;
  const orderDetail = order ? await caller.orders.getById({ id: order.id }) : null;

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            HOC staff
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
              {application.companyName || "Untitled application"}
            </h1>
            <Chip variant={statusVariant[application.status]}>
              {application.status.replace("_", " ")}
            </Chip>
          </div>

          <dl className="mt-10 divide-y divide-contrast-low border-y border-contrast-low">
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Registration number</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.companyRegistrationNumber || "Not provided"}
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Contact phone</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.contactPhone || "Not provided"}
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Verification</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.premblyStatus
                  ? `${application.premblyStatus.replace("_", " ")} - Prembly integration not yet connected`
                  : "Not started"}
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            <p className="text-sm font-semibold">Documents</p>
            <ul className="mt-4 grid gap-2">
              {documentLinks.map((doc) => (
                <li className="flex items-center justify-between border-b border-contrast-low py-3 text-sm" key={doc.id}>
                  <span>{doc.kind.replace("_", " ")}</span>
                  {doc.url ? (
                    <a className="underline underline-offset-4" href={doc.url} rel="noreferrer" target="_blank">
                      View
                    </a>
                  ) : (
                    <span className="text-contrast-medium">Unavailable</span>
                  )}
                </li>
              ))}
              {documentLinks.length === 0 ? (
                <li className="py-3 text-sm text-contrast-medium">No documents uploaded yet.</li>
              ) : null}
            </ul>
          </div>

          {!isDecided ? (
            <form action={decideApplication} className="mt-10 flex flex-wrap gap-4">
              <input name="applicationId" type="hidden" value={application.id} />
              <Button name="decision" type="submit" value="approved" variant="signal">
                Approve
              </Button>
              <Button name="decision" type="submit" value="declined" variant="outline">
                Decline
              </Button>
            </form>
          ) : null}
        </header>

        <div className="min-w-0 lg:col-span-4 lg:col-start-9">
          <p className="text-sm font-semibold">Notes</p>
          <ul className="mt-4 grid gap-4">
            {notes.map((note) => (
              <li className="border-l-2 border-contrast-low pl-4 text-sm leading-6 text-contrast-high" key={note.id}>
                <p>{note.body}</p>
                <p className="mt-1 text-xs text-contrast-medium">
                  {note.internal ? "Internal" : "Visible to applicant"} ·{" "}
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {notes.length === 0 ? (
              <li className="text-sm text-contrast-medium">No notes yet.</li>
            ) : null}
          </ul>

          <form action={addStaffNote} className="mt-6 grid gap-4">
            <input name="applicationId" type="hidden" value={application.id} />
            <Textarea id="body" label="Add a note" name="body" required />
            <label className="flex items-center gap-2 text-sm">
              <input defaultChecked name="internal" type="checkbox" />
              Internal only
            </label>
            <Button className="justify-self-start" type="submit" variant="secondary">
              Add note
            </Button>
          </form>
        </div>
      </section>

      {application.status === "approved" ? (
        <section className="border-t border-contrast-low bg-surface">
          <div className="page-shell grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
            <header className="min-w-0 lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
                Order
              </p>
              <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
                {order ? "Fleet order" : "Convert to an order"}
              </h2>

              {!order || order.status === "cancelled" ? (
                <>
                  {order?.status === "cancelled" ? (
                    <p className="mt-4 text-sm text-contrast-medium">
                      The previous order for this application was cancelled. Start a
                      new one below.
                    </p>
                  ) : null}
                  <form action={createOrder} className="mt-8 grid max-w-md gap-6">
                    <input name="applicationId" type="hidden" value={application.id} />
                    <Field
                      description="Total for the full fleet deal, in major currency units (e.g. 5000000.00)."
                      id="total"
                      label="Total"
                      min="0"
                      name="total"
                      required
                      step="0.01"
                      type="number"
                    />
                    <Field
                      description="Amount due immediately. Cannot exceed the total."
                      id="deposit"
                      label="Deposit"
                      min="0"
                      name="deposit"
                      required
                      step="0.01"
                      type="number"
                    />
                    <SelectField defaultValue="NGN" id="currency" label="Currency" name="currency">
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </SelectField>
                    <Textarea
                      description="Optional context for this pricing - shown to staff only."
                      id="pricingNote"
                      label="Pricing note"
                      name="pricingNote"
                    />
                    <Button className="justify-self-start" type="submit" variant="signal">
                      Create order
                    </Button>
                  </form>
                </>
              ) : order.status === "draft" ? (
                <form action={updateOrderTotals} className="mt-8 grid max-w-md gap-6">
                  <input name="applicationId" type="hidden" value={application.id} />
                  <input name="orderId" type="hidden" value={order.id} />
                  <Field
                    defaultValue={(order.totalMinor / 100).toFixed(2)}
                    id="total"
                    label="Total"
                    min="0"
                    name="total"
                    required
                    step="0.01"
                    type="number"
                  />
                  <Field
                    defaultValue={(order.depositMinor / 100).toFixed(2)}
                    id="deposit"
                    label="Deposit"
                    min="0"
                    name="deposit"
                    required
                    step="0.01"
                    type="number"
                  />
                  <SelectField
                    defaultValue={order.currency}
                    id="currency"
                    label="Currency"
                    name="currency"
                  >
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                  </SelectField>
                  <Textarea
                    defaultValue={order.pricingNote ?? ""}
                    id="pricingNote"
                    label="Pricing note"
                    name="pricingNote"
                  />
                  <div className="flex flex-wrap gap-4">
                    <Button type="submit" variant="secondary">
                      Save totals
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="mt-4 max-w-[52ch] text-sm leading-6 text-contrast-high">
                    {order.pricingNote || "No pricing note recorded."}
                  </p>
                  {orderDetail && orderDetail.payments.length > 0 ? (
                    <div className="mt-8">
                      <DataTable
                        caption="Payments for this order"
                        columns={[
                          { key: "kind", label: "Kind" },
                          { key: "amount", align: "right", label: "Amount" },
                          { key: "status", label: "Status" },
                          { key: "date", label: "Date" },
                        ]}
                        rows={orderDetail.payments.map((payment) => ({
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
                    <p className="mt-8 text-sm text-contrast-medium">
                      No payment attempts yet.
                    </p>
                  )}
                </>
              )}

              {order && order.status !== "cancelled" && order.status !== "paid_in_full" ? (
                <form action={cancelOrder} className="mt-8">
                  <input name="applicationId" type="hidden" value={application.id} />
                  <input name="orderId" type="hidden" value={order.id} />
                  <Button type="submit" variant="outline">
                    Cancel order
                  </Button>
                </form>
              ) : null}
            </header>

            {order && order.status !== "cancelled" ? (
              <div className="min-w-0 lg:col-span-4 lg:col-start-9">
                <StickySummary
                  action={
                    order.status === "draft" ? (
                      <form action={finalizeOrder}>
                        <input name="applicationId" type="hidden" value={application.id} />
                        <input name="orderId" type="hidden" value={order.id} />
                        <Button className="w-full" type="submit" variant="signal">
                          Finalize order
                        </Button>
                      </form>
                    ) : undefined
                  }
                  heading="Order summary"
                  rows={[
                    { label: "Status", value: order.status.replace(/_/g, " ") },
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
            ) : null}
          </div>
        </section>
      ) : null}

      <MarketingFooter />
    </main>
  );
}
