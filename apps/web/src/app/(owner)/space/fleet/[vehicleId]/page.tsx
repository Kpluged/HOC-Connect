import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { SelectField } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { getVehicle } from "@/features/catalogue/data";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { signDriverPhotoUrls } from "@/lib/server/driver-photos";
import { getServerCaller } from "@/server/trpc/caller";

import { assignDriver, endShiftForVehicle } from "../actions";

export const metadata: Metadata = {
  description: "Vehicle detail and current driver assignment.",
  title: "Vehicle",
};

const statusVariant = {
  active: "live",
  allocated: "neutral",
  delivered: "selected",
} as const;

export default async function OwnerVehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const { vehicleId } = await params;
  const caller = await getServerCaller();
  const orgVehicles = await caller.vehicles.listByOrganization({
    organizationId: organization.id,
  });
  const vehicle = orgVehicles.find((candidate) => candidate.id === vehicleId);
  if (!vehicle) notFound();

  const [shiftHistory, orgDrivers] = await Promise.all([
    caller.shifts.listByVehicle({ vehicleId }),
    caller.drivers.listByOrganization({ organizationId: organization.id }),
  ]);

  const activeShift = shiftHistory.find((shift) => !shift.endedAt) ?? null;
  const assignableDrivers = orgDrivers.filter((driver) => driver.status === "active");
  const activeDriver = activeShift
    ? orgDrivers.find((driver) => driver.id === activeShift.driverId) ?? null
    : null;
  const activeDriverPhoto = activeDriver?.photoPath
    ? (await signDriverPhotoUrls([activeDriver.photoPath])).get(activeDriver.photoPath)
    : null;

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
        <header className="min-w-0 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Owner Space
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
              {getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug}
            </h1>
            <Chip variant={statusVariant[vehicle.status]}>{vehicle.status}</Chip>
          </div>

          <dl className="mt-10 divide-y divide-contrast-low border-y border-contrast-low">
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">VIN</dt>
              <dd className="text-sm font-semibold sm:text-right">{vehicle.vin}</dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Plate</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {vehicle.plate || "Not provided"}
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            <p className="text-sm font-semibold">Assignment history</p>
            {shiftHistory.length > 0 ? (
              <div className="mt-4">
                <DataTable
                  caption="Assignment history for this vehicle"
                  columns={[
                    { key: "driver", label: "Driver" },
                    { key: "started", label: "Started" },
                    { key: "ended", label: "Ended" },
                  ]}
                  rows={shiftHistory.map((shift) => ({
                    id: shift.id,
                    values: {
                      driver:
                        orgDrivers.find((driver) => driver.id === shift.driverId)?.displayName ??
                        shift.driverId,
                      ended: shift.endedAt
                        ? new Date(shift.endedAt).toLocaleString()
                        : "Active",
                      started: new Date(shift.startedAt).toLocaleString(),
                    },
                  }))}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-contrast-medium">No assignments yet.</p>
            )}
          </div>
        </header>

        <div className="min-w-0 lg:col-span-4 lg:col-start-9">
          <p className="text-sm font-semibold">Driver assignment</p>
          {activeShift ? (
            <div className="mt-4 rounded-card border border-contrast-low bg-surface p-6">
              <p className="text-sm text-contrast-medium">Currently driven by</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar
                  name={activeDriver?.displayName ?? "Driver"}
                  photoUrl={activeDriverPhoto}
                />
                <p className="min-w-0 truncate text-lg font-semibold">
                  {activeDriver?.displayName ?? "Driver"}
                </p>
              </div>
              <p className="mt-2 text-sm text-contrast-medium">
                Since {new Date(activeShift.startedAt).toLocaleString()}
              </p>
              <form action={endShiftForVehicle} className="mt-6">
                <input name="vehicleId" type="hidden" value={vehicle.id} />
                <input name="shiftId" type="hidden" value={activeShift.id} />
                <Button className="w-full" type="submit" variant="outline">
                  End shift
                </Button>
              </form>
            </div>
          ) : assignableDrivers.length > 0 ? (
            <form action={assignDriver} className="mt-4 grid gap-4">
              <input name="organizationId" type="hidden" value={organization.id} />
              <input name="vehicleId" type="hidden" value={vehicle.id} />
              <SelectField id="driverId" label="Driver" name="driverId" required>
                {assignableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.displayName}
                  </option>
                ))}
              </SelectField>
              <Button className="w-full" type="submit" variant="signal">
                Assign driver
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-contrast-medium">
              No active drivers available to assign yet.
            </p>
          )}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
