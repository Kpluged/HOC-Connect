"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

/** Staff enter totals in major currency units (e.g. "500000.00"); the
 * contracts schema and DB store minor units (bigint) - never floats. */
function toMinorUnits(value: FormDataEntryValue | null): number {
  const parsed = z.coerce.number().nonnegative().parse(value);
  return Math.round(parsed * 100);
}

export async function createOrder(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const currency = z.string().length(3).parse(formData.get("currency")).toUpperCase();
  const totalMinor = toMinorUnits(formData.get("total"));
  const depositMinor = toMinorUnits(formData.get("deposit"));
  const pricingNote = formData.get("pricingNote")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  await caller.orders.createForApplication({
    applicationId,
    currency,
    depositMinor,
    pricingNote,
    totalMinor,
  });

  redirect(`/admin/applications/${applicationId}`);
}

export async function updateOrderTotals(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const orderId = z.uuid().parse(formData.get("orderId"));
  const currency = z.string().length(3).parse(formData.get("currency")).toUpperCase();
  const totalMinor = toMinorUnits(formData.get("total"));
  const depositMinor = toMinorUnits(formData.get("deposit"));
  const pricingNote = formData.get("pricingNote")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  await caller.orders.updateTotals({
    currency,
    depositMinor,
    orderId,
    pricingNote,
    totalMinor,
  });

  redirect(`/admin/applications/${applicationId}`);
}

export async function finalizeOrder(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const orderId = z.uuid().parse(formData.get("orderId"));

  const caller = await getServerCaller();
  await caller.orders.finalize({ orderId });

  redirect(`/admin/applications/${applicationId}`);
}

export async function cancelOrder(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const orderId = z.uuid().parse(formData.get("orderId"));

  const caller = await getServerCaller();
  await caller.orders.cancel({ orderId });

  redirect(`/admin/applications/${applicationId}`);
}
