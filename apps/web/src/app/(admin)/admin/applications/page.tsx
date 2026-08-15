import type { applicationStatusSchema } from "@hoc/contracts";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import type { z } from "zod";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { StaffOnlyNotice } from "@/components/admin/staff-only-notice";
import { Chip } from "@/components/ui/chip";
import { DataTable, type DataRow } from "@/components/ui/data-table";
import { SiteHeader } from "@/components/ui/site-header";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "HOC staff review queue for fleet applications.",
  title: "Application review",
};

const statusVariant = {
  approved: "live",
  declined: "inactive",
  draft: "neutral",
  submitted: "selected",
  under_review: "selected",
} as const;

const statusFilters = ["submitted", "under_review", "approved", "declined"] as const;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const statusParam = firstParam(query, "status") as
    | z.infer<typeof applicationStatusSchema>
    | undefined;

  const caller = await getServerCaller();

  let applications;
  try {
    applications = await caller.applications.listForReview(
      statusParam ? { status: statusParam } : undefined,
    );
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

  const rows: DataRow[] = applications.map((application) => ({
    id: application.id,
    values: {
      company: application.companyName || "Not provided",
      status: <Chip variant={statusVariant[application.status]}>{application.status.replace("_", " ")}</Chip>,
      submitted: application.submittedAt
        ? new Date(application.submittedAt).toLocaleDateString()
        : "Not submitted",
      view: (
        <Link className="underline underline-offset-4" href={`/admin/applications/${application.id}`}>
          Review
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
            HOC staff
          </p>
          <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Application review
          </h1>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            className={`inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold ${!statusParam ? "border-primary bg-primary text-canvas" : "border-contrast-low text-contrast-high"}`}
            href="/admin/applications"
          >
            All
          </Link>
          {statusFilters.map((status) => (
            <Link
              className={`inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold ${statusParam === status ? "border-primary bg-primary text-canvas" : "border-contrast-low text-contrast-high"}`}
              href={`/admin/applications?status=${status}`}
              key={status}
            >
              {status.replace("_", " ")}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {rows.length > 0 ? (
            <DataTable
              caption="Applications pending HOC review"
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
              No applications match this filter.
            </p>
          )}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
