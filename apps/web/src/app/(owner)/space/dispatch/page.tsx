import type { Metadata } from "next";

import { DispatchBoard } from "@/components/owner/dispatch-board";
import { OwnerSpaceShell } from "@/components/owner/owner-space-shell";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { signDriverPhotoUrls } from "@/lib/server/driver-photos";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Live dispatch: create rides, assign the nearest driver, and monitor trips on the map.",
  title: "Dispatch",
};

export default async function DispatchPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const [trips, dispatchDrivers, driverRoster, vehicleList] = await Promise.all([
    caller.trips.listByOrganization({ organizationId: organization.id }),
    caller.drivers.listForDispatch({ organizationId: organization.id }),
    caller.drivers.listByOrganization({ organizationId: organization.id }),
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
  ]);

  const assignableDrivers = driverRoster.map((driver) => ({
    id: driver.id,
    displayName: driver.displayName,
    operationalStatus: driver.operationalStatus,
  }));

  // Sign each driver's photo once and key it by driver id, so the board can
  // show avatars on assigned trip cards.
  const signedPhotos = await signDriverPhotoUrls(
    driverRoster.map((driver) => driver.photoPath),
  );
  const driverPhotos: Record<string, string> = {};
  for (const driver of driverRoster) {
    const url = driver.photoPath ? signedPhotos.get(driver.photoPath) : undefined;
    if (url) driverPhotos[driver.id] = url;
  }

  const vehicles = vehicleList
    .filter((vehicle) => vehicle.status === "delivered" || vehicle.status === "active")
    .map((vehicle) => ({
      id: vehicle.id,
      label: vehicle.plate
        ? `${vehicle.vehicleModelSlug} · ${vehicle.plate}`
        : vehicle.vehicleModelSlug,
    }));

  return (
    <OwnerSpaceShell active="dispatch" organizationName={organization.name}>
      <DispatchBoard
        assignableDrivers={assignableDrivers}
        driverPhotos={driverPhotos}
        drivers={dispatchDrivers}
        organizationId={organization.id}
        trips={trips}
        vehicles={vehicles}
      />
    </OwnerSpaceShell>
  );
}
