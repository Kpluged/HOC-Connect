import type { vehicleLifecycleStatusSchema } from "@hoc/contracts";
import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import Link from "next/link";
import type { z } from "zod";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { StaffOnlyNotice } from "@/components/admin/staff-only-notice";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable, type DataRow } from "@/components/ui/data-table";
import { SiteHeader } from "@/components/ui/site-header";
import { getVehicle } from "@/features/catalogue/data";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getServerCaller } from "@/server/trpc/caller";

import { activateVehicle, markVehicleDelivered } from "./actions";

export const metadata: Metadata = {
  description: "Vehicle stock and allocation across every organization.",
  title: "Inventory",
};

const statusVariant = {
  active: "live",
  allocated: "neutral",
  delivered: "selected",
} as const;

const statusFilters = ["allocated", "delivered", "active"] as const;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const statusParam = firstParam(query, "status") as
    | z.infer<typeof vehicleLifecycleStatusSchema>
    | undefined;

  const caller = await getServerCaller();

  let entries;
  try {
    entries = await caller.vehicles.listAll(statusParam ? { status: statusParam } : undefined);
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

  const rows: DataRow[] = entries.map(({ organizationName, vehicle }) => ({
    id: vehicle.id,
    values: {
      action:
        vehicle.status === "allocated" ? (
          <form action={markVehicleDelivered}>
            <input name="status" type="hidden" value={statusParam ?? ""} />
            <input name="vehicleId" type="hidden" value={vehicle.id} />
            <Button type="submit" variant="outline">
              Mark delivered
            </Button>
          </form>
        ) : vehicle.status === "delivered" ? (
          <form action={activateVehicle}>
            <input name="status" type="hidden" value={statusParam ?? ""} />
            <input name="vehicleId" type="hidden" value={vehicle.id} />
            <Button type="submit" variant="outline">
              Activate
            </Button>
          </form>
        ) : null,
      allocated: new Date(vehicle.allocatedAt).toLocaleDateString(),
      model: getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug,
      organization: organizationName,
      plate: vehicle.plate || "-",
      status: <Chip variant={statusVariant[vehicle.status]}>{vehicle.status}</Chip>,
      vin: vehicle.vin,
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
            Inventory
          </h1>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            className={`inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold ${!statusParam ? "border-primary bg-primary text-canvas" : "border-contrast-low text-contrast-high"}`}
            href="/admin/inventory"
          >
            All
          </Link>
          {statusFilters.map((status) => (
            <Link
              className={`inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold ${statusParam === status ? "border-primary bg-primary text-canvas" : "border-contrast-low text-contrast-high"}`}
              href={`/admin/inventory?status=${status}`}
              key={status}
            >
              {status}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {rows.length > 0 ? (
            <DataTable
              caption="Allocated vehicles across every organization"
              columns={[
                { key: "organization", label: "Organization" },
                { key: "model", label: "Model" },
                { key: "vin", label: "VIN" },
                { key: "plate", label: "Plate" },
                { key: "status", label: "Status" },
                { key: "allocated", label: "Allocated" },
                { align: "right", key: "action", label: "" },
              ]}
              rows={rows}
            />
          ) : (
            <p className="text-sm leading-6 text-contrast-medium">
              No vehicles match this filter.
            </p>
          )}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
