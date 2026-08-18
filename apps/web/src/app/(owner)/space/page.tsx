import type { Metadata } from "next";
import Link from "next/link";

import { OwnerSpaceShell } from "@/components/owner/owner-space-shell";
import { Chip } from "@/components/ui/chip";
import { KpiTile } from "@/components/ui/kpi-tile";
import { MapPanel } from "@/components/ui/map-panel";
import { Monogram } from "@/components/ui/monogram";
import { StatBar } from "@/components/ui/stat-bar";
import { StatusDot } from "@/components/ui/status-dot";
import { getVehicle } from "@/features/catalogue/data";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Fleet overview: drivers, vehicles, and active assignments.",
  title: "Owner Space",
};

const driverStatusVariant = {
  active: "live",
  disabled: "inactive",
  invited: "neutral",
} as const;

function timeAgo(from: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
  const days = Math.floor(seconds / 86_400);
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(seconds / 3_600);
  if (hours >= 1) return `${hours}h ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 1) return `${minutes}m ago`;
  return "just now";
}

export default async function OwnerSpaceOverviewPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const [driverList, vehicleList, activeShifts] = await Promise.all([
    caller.drivers.listByOrganization({ organizationId: organization.id }),
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
    caller.shifts.listActiveByOrganization({ organizationId: organization.id }),
  ]);

  const statusCounts = {
    active: vehicleList.filter((vehicle) => vehicle.status === "active").length,
    allocated: vehicleList.filter((vehicle) => vehicle.status === "allocated").length,
    delivered: vehicleList.filter((vehicle) => vehicle.status === "delivered").length,
  };
  // Road-ready = delivered or active; the honest denominator for utilisation.
  const roadReady = statusCounts.delivered + statusCounts.active;
  const utilisation =
    roadReady > 0 ? Math.round((activeShifts.length / roadReady) * 100) : 0;
  const rosterPreview = driverList.slice(0, 5);

  return (
    <OwnerSpaceShell active="overview" organizationName={organization.name}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Drivers" value={driverList.length} />
        <KpiTile label="Vehicles" value={vehicleList.length} />
        <KpiTile label="Active assignments" value={activeShifts.length} />
        <KpiTile
          label="Utilisation"
          note="Active assignments vs. road-ready vehicles."
          unit="%"
          value={utilisation}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Active assignments</h2>
            <Link
              className="text-sm font-semibold text-contrast-medium underline-offset-4 hover:text-primary hover:underline"
              href="/space/fleet"
            >
              View fleet
            </Link>
          </div>
          {activeShifts.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {activeShifts.map(({ driver, shift, vehicle }) => (
                <article
                  className="rounded-card border border-contrast-low bg-surface-raised p-5"
                  key={shift.id}
                >
                  <div className="flex items-center gap-3">
                    <Monogram name={driver.displayName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{driver.displayName}</p>
                      <p className="text-xs text-contrast-medium">
                        Since {timeAgo(new Date(shift.startedAt))}
                      </p>
                    </div>
                    <span className="ml-auto">
                      <StatusDot label="On shift" live />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-contrast-low pt-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug}
                      </p>
                      <p className="tabular-nums text-xs text-contrast-medium">{vehicle.vin}</p>
                    </div>
                    <Link
                      className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
                      href={`/space/fleet/${vehicle.id}`}
                    >
                      Open
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-card border border-contrast-low bg-surface p-6 text-sm text-contrast-medium">
              No active assignments yet. Assign a driver to a road-ready vehicle from the
              Fleet tab.
            </p>
          )}
        </div>

        <div className="min-w-0 lg:col-span-5">
          <h2 className="text-sm font-semibold">Fleet status</h2>
          <div className="mt-4 rounded-card border border-contrast-low bg-surface-raised p-6">
            <StatBar
              segments={[
                { fill: "bg-contrast-low", label: "Allocated", value: statusCounts.allocated },
                { fill: "bg-contrast-medium", label: "Delivered", value: statusCounts.delivered },
                { fill: "bg-primary", label: "Active", value: statusCounts.active },
              ]}
            />
            <p className="mt-5 border-t border-contrast-low pt-4 text-xs text-contrast-medium">
              {roadReady} of {vehicleList.length} vehicles road-ready.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Roster</h2>
            <Link
              className="text-sm font-semibold text-contrast-medium underline-offset-4 hover:text-primary hover:underline"
              href="/space/drivers"
            >
              Manage drivers
            </Link>
          </div>
          {rosterPreview.length > 0 ? (
            <ul className="mt-4 divide-y divide-contrast-low overflow-hidden rounded-card border border-contrast-low">
              {rosterPreview.map((driver) => (
                <li key={driver.id}>
                  <Link
                    className="flex items-center gap-3 p-4 transition-colors duration-[var(--duration-hover)] hover:bg-surface"
                    href={`/space/drivers/${driver.id}`}
                  >
                    <Monogram name={driver.displayName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{driver.displayName}</p>
                      <p className="text-xs text-contrast-medium">
                        {driver.phone || "No phone on file"}
                      </p>
                    </div>
                    <Chip className="ml-auto" variant={driverStatusVariant[driver.status]}>
                      {driver.status}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-card border border-contrast-low bg-surface p-6 text-sm text-contrast-medium">
              No drivers on the roster yet.
            </p>
          )}
        </div>

        <div className="min-w-0 lg:col-span-5">
          <h2 className="text-sm font-semibold">Coming next</h2>
          <div className="mt-4 grid gap-4">
            <MapPanel label="Live dispatch preview">
              <span className="inline-flex rounded-control bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-contrast-medium">
                Preview · Milestone 9
              </span>
              <p className="mt-4 max-w-[34ch] text-sm leading-6 text-contrast-high">
                Live GPS dispatch, incoming ride requests, and nearest-driver assignment
                on a real map.
              </p>
            </MapPanel>
            <div className="rounded-card border border-contrast-low bg-frosted p-6 backdrop-blur-xl">
              <span className="inline-flex rounded-control bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-contrast-medium">
                Preview · Milestone 10
              </span>
              <p className="mt-4 max-w-[34ch] text-sm leading-6 text-contrast-high">
                Earnings, trip history, battery and vehicle health, and maintenance — one
                fleet-intelligence dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OwnerSpaceShell>
  );
}
