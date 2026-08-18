import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SelectField } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { StatusDot } from "@/components/ui/status-dot";
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

function formatDateTime(value: Date | string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const assignedVehicleRow = activeShift
    ? (orgVehicles.find((vehicle) => vehicle.id === activeShift.vehicleId) ?? null)
    : null;
  const assignedVehicle = assignedVehicleRow
    ? getVehicle(assignedVehicleRow.vehicleModelSlug)
    : null;
  const firstName = driver.displayName.trim().split(/\s+/)[0] ?? "this driver";

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell pb-24 pt-10 lg:pb-32 lg:pt-16">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-contrast-medium underline-offset-4 hover:text-primary hover:underline"
          href="/space/drivers"
        >
          <span aria-hidden="true">←</span> Drivers
        </Link>

        {/* Hero */}
        <header className="mt-6 flex flex-col gap-6 border-b border-contrast-low pb-10 sm:flex-row sm:items-center sm:gap-7">
          <Avatar name={driver.displayName} photoUrl={photoUrl} size="xl" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
              Owner Space · Driver
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(2.25rem,4.5vw,3.75rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                {driver.displayName}
              </h1>
              <Chip variant={statusVariant[driver.status]}>{driver.status}</Chip>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-contrast-medium">
              <span>{driver.phone || "No phone on file"}</span>
              {driver.licenceReference ? (
                <span className="tabular-nums">Licence {driver.licenceReference}</span>
              ) : null}
              {activeShift ? (
                <span className="inline-flex items-center">
                  <StatusDot label="On shift" live />
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* Left: assignment showcase + shift history */}
          <div className="min-w-0 space-y-10 lg:col-span-8">
            <section>
              <h2 className="text-sm font-semibold">Current assignment</h2>
              {activeShift && assignedVehicleRow ? (
                <div className="mt-4 overflow-hidden rounded-card border border-contrast-low bg-surface-raised">
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-b from-surface to-canvas">
                    {assignedVehicle?.image ? (
                      <Image
                        alt={assignedVehicle.name}
                        className={
                          assignedVehicle.imageFit === "cover"
                            ? "object-cover"
                            : "object-contain p-6 drop-shadow-[0_20px_28px_rgba(0,0,0,0.18)]"
                        }
                        fill
                        quality={90}
                        sizes="(min-width: 1024px) 52vw, 92vw"
                        src={assignedVehicle.image}
                      />
                    ) : null}
                    <span className="absolute left-4 top-4 inline-flex items-center rounded-control bg-canvas/90 px-3 py-1.5 backdrop-blur-sm">
                      <StatusDot label="On shift" live />
                    </span>
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-contrast-medium">
                      {assignedVehicle?.category ?? "Vehicle"}
                    </p>
                    <h3 className="mt-1.5 text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-[-0.03em]">
                      {assignedVehicle?.name ?? assignedVehicleRow.vehicleModelSlug}
                    </h3>
                    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-contrast-low pt-5 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-contrast-medium">VIN</dt>
                        <dd className="mt-1 text-sm font-semibold tabular-nums">{assignedVehicleRow.vin}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-contrast-medium">Plate</dt>
                        <dd className="mt-1 text-sm font-semibold">{assignedVehicleRow.plate || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-contrast-medium">On shift since</dt>
                        <dd className="mt-1 text-sm font-semibold">{formatDateTime(activeShift.startedAt)}</dd>
                      </div>
                    </dl>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <form action={endShift}>
                        <input name="driverId" type="hidden" value={driver.id} />
                        <input name="shiftId" type="hidden" value={activeShift.id} />
                        <Button type="submit" variant="outline">
                          End shift
                        </Button>
                      </form>
                      <Link
                        className="text-sm font-semibold underline-offset-4 hover:underline"
                        href={`/space/fleet/${assignedVehicleRow.id}`}
                      >
                        View vehicle →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : assignableVehicles.length > 0 ? (
                <div className="mt-4 rounded-card border border-contrast-low bg-surface p-6">
                  <p className="text-sm font-semibold">No active assignment</p>
                  <p className="mt-1 text-sm text-contrast-medium">
                    Put {firstName} on shift by assigning a road-ready vehicle.
                  </p>
                  <form action={assignVehicle} className="mt-5 grid gap-4 sm:max-w-md">
                    <input name="organizationId" type="hidden" value={organization.id} />
                    <input name="driverId" type="hidden" value={driver.id} />
                    <SelectField id="vehicleId" label="Vehicle" name="vehicleId" required>
                      {assignableVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {getVehicle(vehicle.vehicleModelSlug)?.name ?? vehicle.vehicleModelSlug} — {vehicle.vin}
                        </option>
                      ))}
                    </SelectField>
                    <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
                      Assign vehicle
                    </Button>
                  </form>
                </div>
              ) : (
                <p className="mt-4 rounded-card border border-dashed border-contrast-low p-6 text-sm text-contrast-medium">
                  No road-ready vehicles available to assign yet.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold">Shift history</h2>
              {shiftHistory.length > 0 ? (
                <ul className="mt-4 divide-y divide-contrast-low overflow-hidden rounded-card border border-contrast-low">
                  {shiftHistory.map((shift) => {
                    const vehicleRow = orgVehicles.find((vehicle) => vehicle.id === shift.vehicleId);
                    const label =
                      getVehicle(vehicleRow?.vehicleModelSlug ?? "")?.name ??
                      vehicleRow?.vin ??
                      shift.vehicleId;
                    return (
                      <li className="flex items-center justify-between gap-4 p-4" key={shift.id}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{label}</p>
                          <p className="mt-0.5 text-xs text-contrast-medium tabular-nums">
                            {formatDateTime(shift.startedAt)}
                            {shift.endedAt ? ` → ${formatDateTime(shift.endedAt)}` : ""}
                          </p>
                        </div>
                        {shift.endedAt ? (
                          <span className="shrink-0 text-xs text-contrast-medium">Ended</span>
                        ) : (
                          <span className="shrink-0">
                            <StatusDot label="Active" live />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 rounded-card border border-dashed border-contrast-low p-6 text-sm text-contrast-medium">
                  No shifts yet.
                </p>
              )}
            </section>
          </div>

          {/* Right: photo, details, status */}
          <div className="min-w-0 space-y-6 lg:col-span-4">
            <div className="rounded-card border border-contrast-low bg-surface-raised p-6">
              <p className="text-sm font-semibold">Profile photo</p>
              <div className="mt-4 flex items-center gap-4">
                <Avatar name={driver.displayName} photoUrl={photoUrl} size="md" />
                <p className="min-w-0 text-sm text-contrast-medium">
                  {photoUrl ? "A photo is set for this driver." : "No photo yet — add one below."}
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

            <div className="rounded-card border border-contrast-low bg-surface-raised p-6">
              <p className="text-sm font-semibold">Details</p>
              <dl className="mt-4 divide-y divide-contrast-low">
                <div className="grid gap-1 py-3 first:pt-0">
                  <dt className="text-xs text-contrast-medium">Phone</dt>
                  <dd className="text-sm font-semibold">{driver.phone || "Not provided"}</dd>
                </div>
                <div className="grid gap-1 py-3">
                  <dt className="text-xs text-contrast-medium">Licence reference</dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {driver.licenceReference || "Not provided"}
                  </dd>
                </div>
                <div className="grid gap-1 py-3 last:pb-0">
                  <dt className="text-xs text-contrast-medium">Enrolment status</dt>
                  <dd className="text-sm font-semibold capitalize">{driver.status}</dd>
                </div>
              </dl>
              <form action={updateDriverStatus} className="mt-5 flex flex-wrap gap-3">
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
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
