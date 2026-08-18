"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

export async function assignDriver(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));
  const driverId = z.uuid().parse(formData.get("driverId"));

  const caller = await getServerCaller();
  await caller.shifts.assign({ driverId, organizationId, vehicleId });

  redirect(`/space/fleet/${vehicleId}`);
}

export async function endShiftForVehicle(formData: FormData) {
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));
  const shiftId = z.uuid().parse(formData.get("shiftId"));

  const caller = await getServerCaller();
  await caller.shifts.end({ shiftId });

  redirect(`/space/fleet/${vehicleId}`);
}
