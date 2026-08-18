"use server";

import { maintenanceSeveritySchema, maintenanceStatusSchema } from "@hoc/contracts";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

export async function openTicket(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));
  const category = z.string().trim().min(1).parse(formData.get("category"));
  const severity = maintenanceSeveritySchema.parse(formData.get("severity"));
  const title = z.string().trim().min(1).parse(formData.get("title"));
  const notes = formData.get("notes")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  await caller.maintenance.open({ organizationId, vehicleId, category, severity, title, notes });
  redirect("/space/maintenance");
}

export async function updateTicket(formData: FormData) {
  const ticketId = z.uuid().parse(formData.get("ticketId"));
  const status = maintenanceStatusSchema.parse(formData.get("status"));
  const notes = formData.get("notes")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  await caller.maintenance.update({ ticketId, status, notes });
  redirect("/space/maintenance");
}
