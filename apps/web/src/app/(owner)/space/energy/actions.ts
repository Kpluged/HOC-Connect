"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

const decimalString = z.string().trim().regex(/^\d+(\.\d+)?$/, "expected a number");

/**
 * Parse a non-negative decimal string into an integer scaled by `scale` places,
 * with half-up rounding of the first dropped digit - using string/integer math,
 * never binary float (so "1.005" at scale 2 gives 101, not 100). Keeps money in
 * exact integer minor units.
 */
function toScaledInt(raw: string, scale: number): number {
  const [whole, frac = ""] = raw.split(".");
  const guard = (frac + "0".repeat(scale + 1)).slice(0, scale + 1);
  const base = Number((whole || "0") + guard.slice(0, scale));
  return Number(guard[scale]) >= 5 ? base + 1 : base;
}

export async function logCharging(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));
  const locationLabel = formData.get("locationLabel")?.toString().trim() || undefined;

  const kwhRaw = formData.get("energyKwh")?.toString().trim() || undefined;
  const costRaw = formData.get("costMajor")?.toString().trim() || undefined;
  const currencyRaw = formData.get("currency")?.toString().trim() || undefined;

  // kWh -> Wh (scale 3), major currency units -> integer minor units (scale 2).
  const energyWh = kwhRaw ? toScaledInt(decimalString.parse(kwhRaw), 3) : undefined;
  const costMinor = costRaw ? toScaledInt(decimalString.parse(costRaw), 2) : undefined;

  const caller = await getServerCaller();
  await caller.energy.log({
    organizationId,
    vehicleId,
    locationLabel,
    energyWh,
    costMinor,
    currency: costMinor !== undefined ? currencyRaw : undefined,
  });

  redirect("/space/energy");
}
