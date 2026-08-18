import type { membershipStatusSchema } from "@hoc/contracts";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import type { z } from "zod";

import { StaffOnlyNotice } from "@/components/admin/staff-only-notice";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Chip } from "@/components/ui/chip";
import { DataTable, type DataRow } from "@/components/ui/data-table";
import { SiteHeader } from "@/components/ui/site-header";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Driver roster across every organization.",
  title: "Drivers",
};

const statusVariant = {
  active: "live",
  disabled: "inactive",
  invited: "neutral",
} as const;

const statusFilters = ["invited", "active", "disabled"] as const;

export default async function AdminDriversPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const statusParam = firstParam(query, "status") as
    | z.infer<typeof membershipStatusSchema>
    | undefined;

  const caller = await getServerCaller();

  let entries;
  try {
    entries = await caller.drivers.listAll(statusParam ? { status: statusParam } : undefined);
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

  const rows: DataRow[] = entries.map(({ driver, organizationName }) => ({
    id: driver.id,
    values: {
      created: new Date(driver.createdAt).toLocaleDateString(),
      name: driver.displayName,
      organization: organizationName,
      phone: driver.phone || "-",
      status: <Chip variant={statusVariant[driver.status]}>{driver.status}</Chip>,
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
            Drivers
          </h1>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            className={`inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold ${!statusParam ? "border-primary bg-primary text-canvas" : "border-contrast-low text-contrast-high"}`}
            href="/admin/drivers"
          >
            All
          </Link>
          {statusFilters.map((status) => (
            <Link
              className={`inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold ${statusParam === status ? "border-primary bg-primary text-canvas" : "border-contrast-low text-contrast-high"}`}
              href={`/admin/drivers?status=${status}`}
              key={status}
            >
              {status}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {rows.length > 0 ? (
            <DataTable
              caption="Drivers across every organization"
              columns={[
                { key: "organization", label: "Organization" },
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "status", label: "Status" },
                { key: "created", label: "Added" },
              ]}
              rows={rows}
            />
          ) : (
            <p className="text-sm leading-6 text-contrast-medium">
              No drivers match this filter.
            </p>
          )}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
