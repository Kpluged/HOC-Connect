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

import {
  assignVehicle,
  endShift,
  removeDriverPhoto,
  setDriverPhoto,
  updateDriverStatus,
} from "../actions";

const photoInputClass =
  "block w-full text-sm text-contrast-medium file:mr-3 file:rounded-control file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-canvas hover:file:cursor-pointer";

export const metadata: Metadata = {
  description: "Driver profile, current assignment, and shift history.",
  title: "Driver",
};

const statusVariant = {
  active: "live",
  disabled: "inactive",
  invited: "neutral",
} as const;

export default async function OwnerDriverDetailPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const { driverId } = await params;
  const caller = await getServerCaller();
  const driver = await caller.drivers.getById({ id: driverId });
  if (!driver) notFound();

  const [shiftHistory, orgVehicles] = await Promise.all([
    caller.shifts.listByDriver({ driverId }),
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
  ]);

  const activeShift = shiftHistory.find((shift) => !shift.endedAt) ?? null;
  const assignableVehicles = orgVehicles.filter(
    (vehicle) => vehicle.status === "delivered" || vehicle.status === "active",
  );
  const photoUrl = driver.photoPath
    ? (await signDriverPhotoUrls([driver.photoPath])).get(driver.photoPath)
    : null;

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
        <header className="min-w-0 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Owner Space
          </p>
          <div className="mt-6 flex items-center gap-5 sm:gap-6">
            <Avatar className="hidden sm:inline-flex" name={driver.displayName} photoUrl={photoUrl} size="xl" />
            <Avatar className="sm:hidden" name={driver.displayName} photoUrl={photoUrl} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[clamp(2.25rem,4.5vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                  {driver.displayName}
                </h1>
                <Chip variant={statusVariant[driver.status]}>{driver.status}</Chip>
              </div>
              <p className="mt-2 text-sm text-contrast-medium">
                {driver.phone || "No phone on file"}
              </p>
            </div>
          </div>

          <dl className="mt-10 divide-y divide-contrast-low border-y border-contrast-low">
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Phone</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {driver.phone || "Not provided"}
              </dd>
            </div>
            <div className="grid gap-2 py-5 sm:grid-cols-2">
              <dt className="text-sm text-contrast-medium">Licence reference</dt>
              <dd className="text-sm font-semibold sm:text-right">
                {driver.licenceReference || "Not provided"}
              </dd>
            </div>
          </dl>

          <form action={updateDriverStatus} className="mt-10 flex flex-wrap gap-4">
            <input name="driverId" type="hidden" value={driver.id} />
            {driver.status !== "active" ? (
              <Button name="status" type="submit" value="active" variant="signal">
                Set active
              </Button>
            ) : null}
            {driver.status !== "disabled" ? (
              <Button name="status" type="submit" value="disabled" variant="outline">
                Disable
              </Button>
            ) : null}
          </form>

          <div className="mt-10">
            <p className="text-sm font-semibold">Shift history</p>
            {shiftHistory.length > 0 ? (
              <div className="mt-4">
                <DataTable
                  caption="Shift history for this driver"
                  columns={[
                    { key: "vehicle", label: "Vehicle" },
                    { key: "started", label: "Started" },
                    { key: "ended", label: "Ended" },
                  ]}
                  rows={shiftHistory.map((shift) => ({
                    id: shift.id,
                    values: {
                      ended: shift.endedAt
                        ? new Date(shift.endedAt).toLocaleString()
                        : "Active",
                      started: new Date(shift.startedAt).toLocaleString(),
                      vehicle:
                        orgVehicles.find((vehicle) => vehicle.id === shift.vehicleId)?.vin ??
                        shift.vehicleId,
                    },
                  }))}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-contrast-medium">No shifts yet.</p>
            )}
          </div>
        </header>

        <div className="min-w-0 space-y-8 lg:col-span-4 lg:col-start-9">
          <div className="rounded-card border border-contrast-low bg-surface-raised p-6">
            <p className="text-sm font-semibold">Profile photo</p>
            <div className="mt-4 flex items-center gap-4">
              <Avatar name={driver.displayName} photoUrl={photoUrl} size="md" />
              <p className="min-w-0 text-sm text-contrast-medium">
                {photoUrl
                  ? "A photo is set for this driver."
                  : "No photo yet — add one below."}
              </p>
            </div>
            <form action={setDriverPhoto} className="mt-5 grid gap-3" encType="multipart/form-data">
              <input name="driverId" type="hidden" value={driver.id} />
              <input accept="image/png,image/jpeg,image/webp" className={photoInputClass} name="photo" required type="file" />
              <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
                {photoUrl ? "Replace photo" : "Upload photo"}
              </Button>
            </form>
            {photoUrl ? (
              <form action={removeDriverPhoto} className="mt-3">
                <input name="driverId" type="hidden" value={driver.id} />
                <button className="min-h-11 text-sm font-semibold text-contrast-medium hover:text-primary" type="submit">
                  Remove photo
                </button>
              </form>
            ) : null}
          </div>

          <div>
          <p className="text-sm font-semibold">Vehicle assignment</p>
          {activeShift ? (
            <div className="mt-4 border border-contrast-low bg-surface p-6">
              <p className="text-sm text-contrast-medium">Currently assigned to</p>
              <p className="mt-2 text-lg font-semibold">
                {getVehicle(
                  orgVehicles.find((vehicle) => vehicle.id === activeShift.vehicleId)
                    ?.vehicleModelSlug ?? "",
                )?.name ?? "Vehicle"}
              </p>
              <p className="mt-1 text-sm text-contrast-medium">
                Since {new Date(activeShift.startedAt).toLocaleString()}
              </p>
              <form action={endShift} className="mt-6">
                <input name="driverId" type="hidden" value={driver.id} />
                <input name="shiftId" type="hidden" value={activeShift.id} />
                <Button className="w-full" type="submit" variant="outline">
                  End shift
                </Button>
              </form>
            </div>
          ) : assignableVehicles.length > 0 ? (
            <form action={assignVehicle} className="mt-4 grid gap-4">
              <input name="organizationId" type="hidden" value={organization.id} />
              <input name="driverId" type="hidden" value={driver.id} />
              <SelectField id="vehicleId" label="Vehicle" name="vehicleId" required>
                {assignableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug} -{" "}
                    {vehicle.vin}
                  </option>
                ))}
              </SelectField>
              <Button className="w-full" type="submit" variant="signal">
                Assign vehicle
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-contrast-medium">
              No delivered vehicles available to assign yet.
            </p>
          )}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
