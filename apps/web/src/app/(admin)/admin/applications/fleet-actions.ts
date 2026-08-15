"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

export async function allocateVehicle(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const orderId = z.uuid().parse(formData.get("orderId"));
  const vehicleModelSlug = z.string().min(1).parse(formData.get("vehicleModelSlug"));
  const vin = z.string().min(1).parse(formData.get("vin"));
  const plate = formData.get("plate")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  await caller.vehicles.allocate({ orderId, plate, vehicleModelSlug, vin });

  redirect(`/admin/applications/${applicationId}`);
}

export async function markVehicleDelivered(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));

  const caller = await getServerCaller();
  await caller.vehicles.markDelivered({ vehicleId });

  redirect(`/admin/applications/${applicationId}`);
}

export async function activateVehicle(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));

  const caller = await getServerCaller();
  await caller.vehicles.activate({ vehicleId });

  redirect(`/admin/applications/${applicationId}`);
}
