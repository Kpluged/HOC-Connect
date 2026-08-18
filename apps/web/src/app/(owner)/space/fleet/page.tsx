import type { Metadata } from "next";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { SiteHeader } from "@/components/ui/site-header";
import { getVehicle } from "@/features/catalogue/data";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Your fleet and its current driver assignments.",
  title: "Fleet",
};

const statusVariant = {
  active: "live",
  allocated: "neutral",
  delivered: "selected",
} as const;

export default async function OwnerFleetPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const [vehicleList, activeAssignments] = await Promise.all([
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
    caller.shifts.listActiveByOrganization({ organizationId: organization.id }),
  ]);

  const driverByVehicleId = new Map(
    activeAssignments.map((assignment) => [assignment.vehicle.id, assignment.driver]),
  );

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell py-16 lg:py-24">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Owner Space
          </p>
          <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Fleet
          </h1>
        </header>

        <div className="mt-12">
          {vehicleList.length > 0 ? (
            <DataTable
              caption="Vehicles in this organization"
              columns={[
                { key: "model", label: "Model" },
                { key: "vin", label: "VIN" },
                { key: "status", label: "Status" },
                { key: "driver", label: "Driver" },
                { align: "right", key: "action", label: "" },
              ]}
              rows={vehicleList.map((vehicle) => ({
                id: vehicle.id,
                values: {
                  action: (
                    <Link
                      className="text-sm font-semibold underline-offset-4 hover:underline"
                      href={`/space/fleet/${vehicle.id}`}
                    >
                      View
                    </Link>
                  ),
                  driver: driverByVehicleId.get(vehicle.id)?.displayName ?? "Unassigned",
                  model: getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug,
                  status: (
                    <Chip variant={statusVariant[vehicle.status]}>{vehicle.status}</Chip>
                  ),
                  vin: vehicle.vin,
                },
              }))}
            />
          ) : (
            <p className="text-sm text-contrast-medium">
              No vehicles allocated to your fleet yet.
            </p>
          )}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
