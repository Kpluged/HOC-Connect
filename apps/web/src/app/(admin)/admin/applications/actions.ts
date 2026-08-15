"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";

export async function decideApplication(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const decision = z.enum(["approved", "declined"]).parse(formData.get("decision"));

  const caller = await getServerCaller();
  await caller.applications.decide({ applicationId, decision });

  redirect(`/admin/applications/${applicationId}`);
}

export async function addStaffNote(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const body = z.string().min(1).parse(formData.get("body"));
  const internal = formData.get("internal") === "on";

  const caller = await getServerCaller();
  await caller.applications.addNote({ applicationId, body, internal });

  redirect(`/admin/applications/${applicationId}`);
}
