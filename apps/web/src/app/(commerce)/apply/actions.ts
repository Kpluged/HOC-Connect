"use server";

import {
  applicationDocumentKindSchema,
  type ConfigurationSnapshot,
} from "@hoc/contracts";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerCaller } from "@/server/trpc/caller";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildSnapshotFromFormData(formData: FormData): ConfigurationSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    city: formData.get("city")?.toString() || undefined,
    fleetSize: formData.get("size")?.toString() || undefined,
    livery: formData.get("livery")?.toString() || undefined,
    package: formData.get("package")?.toString() || undefined,
    vehicleSlugs: formData.getAll("mix").map(String),
  };
}

/** Identity step: finds-or-creates the draft org/application, then saves identity. */
export async function startApplication(formData: FormData) {
  const caller = await getServerCaller();

  const existingOrgs = await caller.organizations.getMine();
  const organization =
    existingOrgs[0]?.organization ??
    (await caller.organizations.createDraft({
      cityLabel: formData.get("city")?.toString() || "Not specified",
      name: "My fleet",
    }));

  let application = await caller.applications.getDraftForOrg({
    organizationId: organization.id,
  });

  if (!application) {
    application = await caller.applications.createDraft({
      configurationSnapshot: buildSnapshotFromFormData(formData),
      organizationId: organization.id,
    });
  }

  await caller.applications.upsertIdentity({
    applicationId: application.id,
    fullName: formData.get("fullName")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
  });

  redirect(`/apply/company?applicationId=${application.id}`);
}

export async function submitCompanyStep(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const caller = await getServerCaller();

  await caller.applications.upsertCompany({
    applicationId,
    companyName: formData.get("companyName")?.toString() ?? "",
    companyRegistrationNumber:
      formData.get("companyRegistrationNumber")?.toString() ?? "",
  });

  redirect(`/apply/documents?applicationId=${applicationId}`);
}

export async function uploadDocument(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const kind = applicationDocumentKindSchema.parse(formData.get("kind"));
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/sign-in");

    const storagePath = `${user.id}/${applicationId}/${kind}-${file.name}`;
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(storagePath, file, { upsert: true });

    if (!error) {
      const caller = await getServerCaller();
      await caller.applications.addDocument({
        applicationId,
        kind,
        storagePath,
      });
    }
  }

  redirect(`/apply/documents?applicationId=${applicationId}`);
}

export async function continueToReview(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  redirect(`/apply/review?applicationId=${applicationId}`);
}

export async function submitApplication(formData: FormData) {
  const applicationId = z.uuid().parse(formData.get("applicationId"));
  const caller = await getServerCaller();
  await caller.applications.submit({ applicationId });
  redirect(`/account/applications/${applicationId}`);
}
