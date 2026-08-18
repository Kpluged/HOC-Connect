"use server";

import { membershipStatusSchema } from "@hoc/contracts";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

export async function createDriver(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const displayName = z.string().trim().min(1).parse(formData.get("displayName"));
  const phone = formData.get("phone")?.toString().trim() || undefined;
  const licenceReference =
    formData.get("licenceReference")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  await caller.drivers.create({
    displayName,
    licenceReference,
    organizationId,
    phone,
  });

  redirect("/space/drivers");
}

export async function updateDriverStatus(formData: FormData) {
  const driverId = z.uuid().parse(formData.get("driverId"));
  const status = membershipStatusSchema.parse(formData.get("status"));

  const caller = await getServerCaller();
  await caller.drivers.updateStatus({ driverId, status });

  redirect(`/space/drivers/${driverId}`);
}

export async function assignVehicle(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const driverId = z.uuid().parse(formData.get("driverId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));

  const caller = await getServerCaller();
  await caller.shifts.assign({ driverId, organizationId, vehicleId });

  redirect(`/space/drivers/${driverId}`);
}

export async function endShift(formData: FormData) {
  const driverId = z.uuid().parse(formData.get("driverId"));
  const shiftId = z.uuid().parse(formData.get("shiftId"));

  const caller = await getServerCaller();
  await caller.shifts.end({ shiftId });

  redirect(`/space/drivers/${driverId}`);
}
