import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button, ButtonLink } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { ConfigStepRail } from "@/components/ui/config-step-rail";
import { Field } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { StickySummary } from "@/components/ui/sticky-summary";
import {
  configurationSteps,
  getNextStep,
  isConfigurationStep,
  type ConfigurationStep,
} from "@/features/configurator/data";
import { getSelectedVehicles, valueOf } from "@/features/configurator/query";
import { VehicleMixSelector } from "@/features/configurator/vehicle-mix-selector";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  description: "Shape a proposed HOC Elite Wheels fleet in five clear steps.",
  title: "Fleet configurator",
};

const editableKeys: Record<ConfigurationStep, string[]> = {
  city: ["city"],
  size: ["size"],
  mix: ["mix"],
  package: ["package"],
  review: [],
};

function HiddenQueryFields({
  query,
  step,
}: {
  query: SearchParams;
  step: ConfigurationStep;
}) {
  const excluded = new Set(editableKeys[step]);

  return Object.entries(query).flatMap(([key, rawValue]) => {
    if (excluded.has(key) || rawValue === undefined) return [];
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    return values.map((value, index) => (
      <input key={`${key}-${index}`} name={key} type="hidden" value={value} />
    ));
  });
}

function StepFields({
  query,
  step,
}: {
  query: SearchParams;
  step: ConfigurationStep;
}) {
  if (step === "city") {
    return (
      <Field
        autoComplete="address-level2"
        defaultValue={valueOf(query, "city")}
        description="Enter the city you propose to operate in. Availability is confirmed during review."
        id="city"
        label="Proposed operating city"
        name="city"
        placeholder="Enter a city"
        required
      />
    );
  }

  if (step === "size") {
    return (
      <Field
        defaultValue={valueOf(query, "size")}
        description="Use the intended starting fleet. Capacity and commercial requirements are confirmed later."
        id="size"
        inputMode="numeric"
        label="Proposed fleet size"
        min="1"
        name="size"
        placeholder="Number of vehicles"
        required
        type="number"
      />
    );
  }

  if (step === "mix") {
    const selected = getSelectedVehicles(query).map((vehicle) => vehicle.slug);
    return <VehicleMixSelector selectedSlugs={selected} />;
  }

  if (step === "package") {
    return (
      <RadioGroup
        defaultValue="pending"
        legend="Operating package"
        name="package"
        options={[
          {
            description:
              "Package scope, pricing, and commercial terms will be confirmed during review.",
            label: "Package selection pending",
            value: "pending",
          },
        ]}
      />
    );
  }

  const selectedVehicles = getSelectedVehicles(query);
  const reviewRows = [
    ["City", valueOf(query, "city") || "Not selected"],
    ["Fleet size", valueOf(query, "size") || "Not selected"],
    ["Vehicle mix", selectedVehicles.map((vehicle) => vehicle.name).join(", ") || "Not selected"],
    ["Package", "Pending confirmation"],
    ["Estimated total", "Pending confirmation"],
  ];

  const applyQuery = new URLSearchParams();
  const city = valueOf(query, "city");
  const size = valueOf(query, "size");
  if (city) applyQuery.set("city", city);
  if (size) applyQuery.set("size", size);
  for (const vehicle of selectedVehicles) applyQuery.append("mix", vehicle.slug);

  return (
    <div>
      <p className="text-sm font-semibold">Configuration review</p>
      <dl className="mt-6 divide-y divide-contrast-low border-y border-contrast-low">
        {reviewRows.map(([label, value]) => (
          <div className="grid gap-2 py-5 sm:grid-cols-2" key={label}>
            <dt className="text-sm text-contrast-medium">{label}</dt>
            <dd className="text-sm font-semibold sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 border-l-2 border-signal bg-surface p-5">
        <p className="font-semibold">Ready to take this to an application?</p>
        <p className="mt-2 text-sm leading-6 text-contrast-medium">
          The next steps cover identity verification, company details, and
          document upload. Your configuration carries straight through.
        </p>
        <ButtonLink
          className="mt-6"
          href={`/apply/identity?${applyQuery.toString()}`}
          variant="signal"
        >
          Start application
        </ButtonLink>
      </div>
    </div>
  );
}

const stepIntroductions: Record<ConfigurationStep, { eyebrow: string; heading: string; copy: string }> = {
  city: { eyebrow: "01 / City", heading: "Where will the service operate?", copy: "Begin with the proposed operating market. The entry is captured for review; it does not imply current availability." },
  size: { eyebrow: "02 / Fleet size", heading: "Set the starting scale.", copy: "Record the intended number of vehicles without creating unsupported capacity or pricing promises." },
  mix: { eyebrow: "03 / Vehicle mix", heading: "Compose the proposed fleet.", copy: "Select the catalogue directions that fit the service you intend to build." },
  package: { eyebrow: "04 / Package", heading: "Hold the commercial choice clearly.", copy: "Package names, contents, and pricing require HOC confirmation, so the interface keeps them explicitly pending." },
  review: { eyebrow: "05 / Review", heading: "Check the configuration.", copy: "Review what has been captured before continuing into the application, KYC, and payment journey." },
};

export default async function ConfigurePage({ params, searchParams }: PageProps<"/configure/[step]">) {
  const [{ step: rawStep }, query] = await Promise.all([params, searchParams]);
  if (!isConfigurationStep(rawStep)) notFound();

  const stepIndex = configurationSteps.findIndex((item) => item.key === rawStep);
  const nextStep = getNextStep(rawStep);
  const intro = stepIntroductions[rawStep];
  const isMixStep = rawStep === "mix";
  const selectedVehicles = getSelectedVehicles(query);
  const summaryRows = [
    { label: "City", value: valueOf(query, "city") || "Pending" },
    { label: "Fleet size", value: valueOf(query, "size") || "Pending" },
    { label: "Vehicle mix", value: selectedVehicles.length ? `${selectedVehicles.length} selected` : "Pending" },
    { label: "Total", value: "Pending" },
  ];

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-10 lg:grid-cols-12 lg:pb-32 lg:pt-20">
        <div className="min-w-0 overflow-hidden lg:col-span-2">
          <ConfigStepRail
            steps={configurationSteps.map((item, index) => ({
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

        <div className={`min-w-0 ${isMixStep ? "lg:col-span-6" : "lg:col-span-3"}`}>
          {nextStep ? (
            <form action={`/configure/${nextStep}`} className="grid gap-8" method="get">
              <HiddenQueryFields query={query} step={rawStep} />
              <StepFields query={query} step={rawStep} />
              <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
                Continue to {configurationSteps[stepIndex + 1]?.label}
              </Button>
            </form>
          ) : (
            <StepFields query={query} step={rawStep} />
          )}
        </div>

        {isMixStep ? null : (
          <div className="min-w-0 lg:col-span-3">
            <StickySummary heading="Configuration" rows={summaryRows} />
          </div>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}
