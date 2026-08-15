import type { Metadata } from "next";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Chip } from "@/components/ui/chip";
import { DataTable, type DataRow } from "@/components/ui/data-table";
import { SiteHeader } from "@/components/ui/site-header";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Track the status of your HOC Elite Wheels fleet applications.",
  title: "Your applications",
};

const statusVariant = {
  approved: "live",
  declined: "inactive",
  draft: "neutral",
  submitted: "selected",
  under_review: "selected",
} as const;

export default async function AccountApplicationsPage() {
  const caller = await getServerCaller();
  const applications = await caller.applications.getMine();

  const rows: DataRow[] = applications.map((application) => ({
    id: application.id,
    values: {
      company: application.companyName || "Not provided",
      status: <Chip variant={statusVariant[application.status]}>{application.status.replace("_", " ")}</Chip>,
      submitted: application.submittedAt
        ? new Date(application.submittedAt).toLocaleDateString()
        : "Not submitted",
      view: (
        <Link className="underline underline-offset-4" href={`/account/applications/${application.id}`}>
          View
        </Link>
      ),
    },
  }));

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell py-16 lg:py-24">
        <header className="border-b border-contrast-low pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Account
          </p>
          <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Your applications
          </h1>
        </header>

        <div className="mt-12">
          {rows.length > 0 ? (
            <DataTable
              caption="Your fleet applications"
              columns={[
                { key: "company", label: "Company" },
                { key: "status", label: "Status" },
                { key: "submitted", label: "Submitted" },
                { align: "right", key: "view", label: "" },
              ]}
              rows={rows}
            />
          ) : (
            <p className="text-sm leading-6 text-contrast-medium">
              You haven&apos;t started an application yet. Configure a fleet
              to begin.
            </p>
          )}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
