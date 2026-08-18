import type { Metadata } from "next";
import Link from "next/link";

import { OwnerSpaceShell } from "@/components/owner/owner-space-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { signDriverPhotoUrls } from "@/lib/server/driver-photos";
import { getServerCaller } from "@/server/trpc/caller";

import { createDriver } from "./actions";

export const metadata: Metadata = {
  description: "Driver roster for your fleet.",
  title: "Drivers",
};

const statusVariant = {
  active: "live",
  disabled: "inactive",
  invited: "neutral",
} as const;

export default async function OwnerDriversPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const driverList = await caller.drivers.listByOrganization({
    organizationId: organization.id,
  });
  const photoUrls = await signDriverPhotoUrls(driverList.map((d) => d.photoPath));

  return (
    <OwnerSpaceShell active="drivers" organizationName={organization.name}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Roster</h2>
            <span className="tabular-nums text-sm text-contrast-medium">
              {driverList.length} {driverList.length === 1 ? "driver" : "drivers"}
            </span>
          </div>
          {driverList.length > 0 ? (
            <ul className="mt-4 divide-y divide-contrast-low overflow-hidden rounded-card border border-contrast-low">
              {driverList.map((driver) => (
                <li key={driver.id}>
                  <Link
                    className="flex items-center gap-3 p-4 transition-colors duration-[var(--duration-hover)] hover:bg-surface"
                    href={`/space/drivers/${driver.id}`}
                  >
                    <Avatar
                      name={driver.displayName}
                      photoUrl={driver.photoPath ? photoUrls.get(driver.photoPath) : null}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{driver.displayName}</p>
                      <p className="text-xs text-contrast-medium">
                        {driver.phone || "No phone on file"}
                      </p>
                    </div>
                    <Chip className="ml-auto" variant={statusVariant[driver.status]}>
                      {driver.status}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-card border border-contrast-low bg-surface p-6 text-sm text-contrast-medium">
              No drivers added yet. Add your first driver using the form.
            </p>
          )}
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="rounded-card border border-contrast-low bg-surface-raised p-6">
            <h2 className="text-sm font-semibold">Add a driver</h2>
            <form
              action={createDriver}
              className="mt-5 grid gap-6"
              encType="multipart/form-data"
            >
              <input name="organizationId" type="hidden" value={organization.id} />
              <Field id="displayName" label="Name" name="displayName" required />
              <Field id="phone" label="Phone" name="phone" />
              <Field
                description="Optional — if the driver has already completed a licence check."
                id="licenceReference"
                label="Licence reference"
                name="licenceReference"
              />
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">Profile photo</span>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="block w-full text-sm text-contrast-medium file:mr-3 file:rounded-control file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-canvas hover:file:cursor-pointer"
                  name="photo"
                  type="file"
                />
                <span className="text-xs text-contrast-medium">
                  Optional. JPG, PNG or WebP, up to 5MB.
                </span>
              </div>
              <Button className="w-full" type="submit" variant="signal">
                Add driver
              </Button>
            </form>
          </div>
        </div>
      </div>
    </OwnerSpaceShell>
  );
}
