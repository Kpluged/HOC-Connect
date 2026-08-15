import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Explainer } from "@/components/ui/explainer";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfigStepRail } from "@/components/ui/config-step-rail";
import { Field } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import {
  applicationSteps,
  isApplicationStep,
  requiredDocumentKinds,
  type ApplicationStep,
} from "@/features/applications/data";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { getServerCaller } from "@/server/trpc/caller";

import {
  continueToReview,
  startApplication,
  submitApplication,
  submitCompanyStep,
  uploadDocument,
} from "../actions";

export const metadata: Metadata = {
  description: "Apply for a HOC Elite Wheels fleet: identity, company, documents, and review.",
  title: "Apply",
};

const stepIntroductions: Record<ApplicationStep, { eyebrow: string; heading: string; copy: string }> = {
  identity: {
    copy: "We use this to confirm who's applying. Verification is handled during review.",
    eyebrow: "01 / Identity",
    heading: "Confirm who's applying.",
  },
  company: {
    copy: "Your proposed configuration carries straight through from the configurator - it isn't asked again here.",
    eyebrow: "02 / Company",
    heading: "Tell us about the business.",
  },
  documents: {
    copy: "Upload the documents below. Each is stored privately and only visible to you and HOC staff.",
    eyebrow: "03 / Documents",
    heading: "Upload supporting documents.",
  },
  review: {
    copy: "Check everything before submitting. Authentication, KYC, and payment continue from here.",
    eyebrow: "04 / Review",
    heading: "Review your application.",
  },
};

async function IdentityStep({ query }: { query: SearchParams }) {
  const caller = await getServerCaller();
  const profile = await caller.profile.get();

  return (
    <form action={startApplication} className="grid gap-8">
      {["city", "size", "livery", "package"].map((key) => {
        const value = firstParam(query, key);
        return value ? <input key={key} name={key} type="hidden" value={value} /> : null;
      })}
      {(Array.isArray(query.mix) ? query.mix : query.mix ? [query.mix] : []).map(
        (slug, index) => (
          <input key={index} name="mix" type="hidden" value={slug} />
        ),
      )}
      <Field
        autoComplete="name"
        defaultValue={profile?.fullName ?? undefined}
        id="fullName"
        label="Full name"
        name="fullName"
        required
      />
      <Field
        autoComplete="tel"
        defaultValue={profile?.phone ?? undefined}
        id="phone"
        label="Phone number"
        name="phone"
        required
        type="tel"
      />
      <Explainer term="What is KYC?">
        Know Your Customer - HOC&apos;s standard identity and business
        verification process, required before a fleet application can be
        approved. Verification status is shown plainly at every step; it
        never runs silently.
      </Explainer>
      <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
        Continue to Company
      </Button>
    </form>
  );
}

async function CompanyStep({ applicationId }: { applicationId: string }) {
  const caller = await getServerCaller();
  const result = await caller.applications.getById({ id: applicationId });
  if (!result) notFound();

  const snapshot = result.application.configurationSnapshot;

  return (
    <div className="grid gap-8">
      {snapshot ? (
        <div className="border-l-2 border-contrast-low bg-surface p-5">
          <p className="text-sm font-semibold">Your configuration</p>
          <dl className="mt-3 grid gap-2 text-sm text-contrast-medium">
            <div className="flex justify-between gap-4">
              <dt>City</dt>
              <dd className="text-primary">{snapshot.city ?? "Pending"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Fleet size</dt>
              <dd className="text-primary">{snapshot.fleetSize ?? "Pending"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Vehicles</dt>
              <dd className="text-primary">
                {snapshot.vehicleSlugs.length || "Pending"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
      <form action={submitCompanyStep} className="grid gap-8">
        <input name="applicationId" type="hidden" value={applicationId} />
        <Field
          defaultValue={result.application.companyName ?? undefined}
          id="companyName"
          label="Company name"
          name="companyName"
          required
        />
        <Field
          defaultValue={result.application.companyRegistrationNumber ?? undefined}
          description="Confirmed against your jurisdiction during review."
          id="companyRegistrationNumber"
          label="Company registration number"
          name="companyRegistrationNumber"
          required
        />
        <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
          Continue to Documents
        </Button>
      </form>
    </div>
  );
}

async function DocumentsStep({ applicationId }: { applicationId: string }) {
  const caller = await getServerCaller();
  const result = await caller.applications.getById({ id: applicationId });
  if (!result) notFound();

  const uploadedKinds = new Set(result.documents.map((doc) => doc.kind));

  return (
    <div className="grid gap-8">
      {requiredDocumentKinds.map((doc) => {
        const uploaded = uploadedKinds.has(doc.kind);
        return (
          <div className="border-b border-contrast-low pb-8" key={doc.kind}>
            {uploaded ? (
              <p className="text-sm">
                <span className="font-semibold">{doc.label}</span>
                <span className="ml-2 text-contrast-medium">Uploaded</span>
              </p>
            ) : (
              <form action={uploadDocument} className="grid gap-4">
                <input name="applicationId" type="hidden" value={applicationId} />
                <input name="kind" type="hidden" value={doc.kind} />
                <Field
                  accept="application/pdf,image/*"
                  description={doc.description}
                  id={doc.kind}
                  label={doc.label}
                  name="file"
                  required
                  type="file"
                />
                <Button className="w-full sm:w-auto sm:justify-self-start" type="submit">
                  Upload
                </Button>
              </form>
            )}
          </div>
        );
      })}
      <form action={continueToReview}>
        <input name="applicationId" type="hidden" value={applicationId} />
        <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
          Continue to Review
        </Button>
      </form>
    </div>
  );
}

async function ReviewStep({ applicationId }: { applicationId: string }) {
  const caller = await getServerCaller();
  const [result, profile] = await Promise.all([
    caller.applications.getById({ id: applicationId }),
    caller.profile.get(),
  ]);
  if (!result) notFound();

  const rows: [string, string][] = [
    ["Applicant", profile?.fullName || "Not provided"],
    ["Phone", profile?.phone || "Not provided"],
    ["Company", result.application.companyName || "Not provided"],
    [
      "Registration number",
      result.application.companyRegistrationNumber || "Not provided",
    ],
    ["Documents", `${result.documents.length} of ${requiredDocumentKinds.length} uploaded`],
  ];

  return (
    <div className="grid gap-8">
      <dl className="divide-y divide-contrast-low border-y border-contrast-low">
        {rows.map(([label, value]) => (
          <div className="grid gap-2 py-5 sm:grid-cols-2" key={label}>
            <dt className="text-sm text-contrast-medium">{label}</dt>
            <dd className="text-sm font-semibold sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <form action={submitApplication} className="grid gap-8">
        <input name="applicationId" type="hidden" value={applicationId} />
        <Checkbox
          description="Placeholder consent copy - requires legal review before production."
          id="consent"
          label="I confirm the information provided is accurate and consent to HOC's review process."
          name="consent"
          required
        />
        <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
          Submit application
        </Button>
      </form>
    </div>
  );
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ step: rawStep }, query] = await Promise.all([params, searchParams]);
  if (!isApplicationStep(rawStep)) notFound();

  const applicationId = firstParam(query, "applicationId");
  if (rawStep !== "identity" && !applicationId) redirect("/apply/identity");

  const stepIndex = applicationSteps.findIndex((item) => item.key === rawStep);
  const intro = stepIntroductions[rawStep];

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-10 lg:grid-cols-12 lg:pb-32 lg:pt-20">
        <div className="min-w-0 overflow-hidden lg:col-span-2">
          <ConfigStepRail
            steps={applicationSteps.map((item, index) => ({
              label: item.label,
              state: index < stepIndex ? "complete" : index === stepIndex ? "current" : "upcoming",
            }))}
          />
        </div>
        <header className="min-w-0 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">{intro.eyebrow}</p>
          <h1 className="mt-5 text-[clamp(2.75rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            {intro.heading}
          </h1>
          <p className="mt-6 text-sm leading-6 text-contrast-high">{intro.copy}</p>
        </header>

        <div className="min-w-0 lg:col-span-6">
          {rawStep === "identity" ? <IdentityStep query={query} /> : null}
          {rawStep === "company" && applicationId ? (
            <CompanyStep applicationId={applicationId} />
          ) : null}
          {rawStep === "documents" && applicationId ? (
            <DocumentsStep applicationId={applicationId} />
          ) : null}
          {rawStep === "review" && applicationId ? (
            <ReviewStep applicationId={applicationId} />
          ) : null}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
