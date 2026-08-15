"use server";

import { paymentKindSchema } from "@hoc/contracts";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

export async function acceptOrderTerms(formData: FormData) {
  const orderId = z.uuid().parse(formData.get("orderId"));

  const caller = await getServerCaller();
  await caller.orders.acceptTerms({ orderId });

  redirect(`/orders/${orderId}`);
}

export async function payForOrder(formData: FormData) {
  const orderId = z.uuid().parse(formData.get("orderId"));
  const kind = paymentKindSchema.parse(formData.get("kind"));

  const caller = await getServerCaller();
  const { authorizationUrl } = await caller.orders.initiatePayment({ kind, orderId });

  redirect(authorizationUrl);
}
