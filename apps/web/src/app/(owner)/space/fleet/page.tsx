import type { Metadata } from "next";
import Link from "next/link";

import { OwnerSpaceShell } from "@/components/owner/owner-space-shell";
import { Chip } from "@/components/ui/chip";
import { Monogram } from "@/components/ui/monogram";
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
    <OwnerSpaceShell active="fleet" organizationName={organization.name}>
      {vehicleList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicleList.map((vehicle) => {
            const driver = driverByVehicleId.get(vehicle.id);
            return (
              <Link
                className="group flex flex-col rounded-card border border-contrast-low bg-surface-raised p-5 transition-[transform,border-color] duration-[var(--duration-hover)] ease-[var(--ease-engineered)] hover:-translate-y-0.5 hover:border-contrast-medium"
                href={`/space/fleet/${vehicle.id}`}
                key={vehicle.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold leading-tight">
                      {getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug}
                    </p>
                    <p className="mt-1 tabular-nums text-xs text-contrast-medium">
                      {vehicle.vin} · {vehicle.plate || "No plate"}
                    </p>
                  </div>
                  <Chip variant={statusVariant[vehicle.status]}>{vehicle.status}</Chip>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-contrast-low pt-4">
                  {driver ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <Monogram className="size-8 text-xs" name={driver.displayName} />
                      <span className="truncate text-sm">{driver.displayName}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-contrast-medium">Unassigned</span>
                  )}
                  <span className="shrink-0 text-sm font-semibold text-contrast-medium transition-colors group-hover:text-primary">
                    Manage
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="rounded-card border border-contrast-low bg-surface p-6 text-sm text-contrast-medium">
          No vehicles allocated to your fleet yet.
        </p>
      )}
    </OwnerSpaceShell>
  );
}
