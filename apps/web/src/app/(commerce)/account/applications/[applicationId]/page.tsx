import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SiteHeader } from "@/components/ui/site-header";
import { requiredDocumentKinds } from "@/features/applications/data";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Application status and details.",
  title: "Application",
};

const statusVariant = {
  approved: "live",
  declined: "inactive",
  draft: "neutral",
  submitted: "selected",
  under_review: "selected",
} as const;

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const caller = await getServerCaller();
  const result = await caller.applications.getById({ id: applicationId });
  if (!result) notFound();

  const { application, documents, notes } = result;
  const uploadedKinds = new Set(documents.map((doc) => doc.kind));

  const order =
    application.status === "approved"
      ? await caller.orders.getByApplicationId({ applicationId: application.id })
      : null;

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Application
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
              <dt className="text-sm text-contrast-medium">Documents</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {documents.length} of {requiredDocumentKinds.length} uploaded
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Verification</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.premblyStatus
                  ? application.premblyStatus.replace("_", " ")
                  : "Not started"}
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Submitted</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {application.submittedAt
                  ? new Date(application.submittedAt).toLocaleString()
                  : "Not submitted"}
              </dd>
            </div>
          </dl>

          {requiredDocumentKinds.length > 0 ? (
            <div className="mt-10">
              <p className="text-sm font-semibold">Documents</p>
              <ul className="mt-4 grid gap-2">
                {requiredDocumentKinds.map((doc) => (
                  <li className="flex items-center justify-between border-b border-contrast-low py-3 text-sm" key={doc.kind}>
                    <span>{doc.label}</span>
                    <span className="text-contrast-medium">
                      {uploadedKinds.has(doc.kind) ? "Uploaded" : "Not uploaded"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {notes.length > 0 ? (
            <div className="mt-10">
              <p className="text-sm font-semibold">Notes</p>
              <ul className="mt-4 grid gap-4">
                {notes.map((note) => (
                  <li className="border-l-2 border-contrast-low pl-4 text-sm leading-6 text-contrast-high" key={note.id}>
                    {note.body}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {order ? (
            <div className="mt-10">
              <ButtonLink href={`/orders/${order.id}`} variant="signal">
                View order
              </ButtonLink>
            </div>
          ) : null}
        </header>
      </section>
      <MarketingFooter />
    </main>
  );
}
