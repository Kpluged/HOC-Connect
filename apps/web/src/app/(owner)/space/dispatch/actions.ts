"use server";

import { tripTransitionTargetSchema } from "@hoc/contracts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

const coord = z.coerce.number();

export async function createTrip(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const pickupLabel = z.string().trim().min(1).parse(formData.get("pickupLabel"));
  const dropoffLabel = z.string().trim().min(1).parse(formData.get("dropoffLabel"));
  const pickup = {
    lat: coord.parse(formData.get("pickupLat")),
    lng: coord.parse(formData.get("pickupLng")),
  };
  const dropoff = {
    lat: coord.parse(formData.get("dropoffLat")),
    lng: coord.parse(formData.get("dropoffLng")),
  };

  const caller = await getServerCaller();
  await caller.trips.create({ organizationId, pickupLabel, pickup, dropoffLabel, dropoff });
  revalidatePath("/space/dispatch");
}

export async function assignTrip(formData: FormData) {
  const tripId = z.uuid().parse(formData.get("tripId"));
  const driverId = z.uuid().parse(formData.get("driverId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));

  const caller = await getServerCaller();
  await caller.trips.assign({ tripId, driverId, vehicleId });
  revalidatePath("/space/dispatch");
}

export async function transitionTrip(formData: FormData) {
  const tripId = z.uuid().parse(formData.get("tripId"));
  const next = tripTransitionTargetSchema.parse(formData.get("next"));

  const caller = await getServerCaller();
  await caller.trips.transition({ tripId, next });
  revalidatePath("/space/dispatch");
}
