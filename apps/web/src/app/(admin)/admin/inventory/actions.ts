"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

function redirectTarget(status: FormDataEntryValue | null) {
  const value = status?.toString();
  return value ? `/admin/inventory?status=${value}` : "/admin/inventory";
}

export async function markVehicleDelivered(formData: FormData) {
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));
  const target = redirectTarget(formData.get("status"));

  const caller = await getServerCaller();
  await caller.vehicles.markDelivered({ vehicleId });

  redirect(target);
}

export async function activateVehicle(formData: FormData) {
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));
  const target = redirectTarget(formData.get("status"));

  const caller = await getServerCaller();
  await caller.vehicles.activate({ vehicleId });

  redirect(target);
}
