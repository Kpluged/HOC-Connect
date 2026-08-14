import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { ConfigStepRail } from "@/components/ui/config-step-rail";
import { Field } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { StickySummary } from "@/components/ui/sticky-summary";
import { vehicles } from "@/features/catalogue/data";
import {
  configurationSteps,
  getNextStep,
  isConfigurationStep,
  type ConfigurationStep,
} from "@/features/configurator/data";

export const metadata: Metadata = {
  description: "Shape a proposed HOC Connect fleet in six clear steps.",
  title: "Fleet configurator",
};

type Query = Record<string, string | string[] | undefined>;

const editableKeys: Record<ConfigurationStep, string[]> = {
  city: ["city"],
  size: ["size"],
  mix: ["mix"],
  livery: ["livery"],
  package: ["package"],
  review: [],
};

function valueOf(query: Query, key: string) {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
}

function valuesOf(query: Query, key: string) {
  const value = query[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getSelectedVehicles(query: Query) {
  const selected = valuesOf(query, "mix");
  const initialVehicle = valueOf(query, "vehicle");
  const slugs = selected.length > 0 ? selected : initialVehicle ? [initialVehicle] : [];
  return vehicles.filter((vehicle) => slugs.includes(vehicle.slug));
}

function HiddenQueryFields({ query, step }: { query: Query; step: ConfigurationStep }) {
  const excluded = new Set(editableKeys[step]);

  return Object.entries(query).flatMap(([key, rawValue]) => {
    if (excluded.has(key) || rawValue === undefined) return [];
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    return values.map((value, index) => (
      <input key={`${key}-${index}`} name={key} type="hidden" value={value} />
    ));
  });
}

function Choice({
  defaultChecked,
  description,
  label,
  name,
  type = "radio",
  value,
}: {
  defaultChecked?: boolean;
  description: string;
  label: string;
  name: string;
  type?: "checkbox" | "radio";
  value: string;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer items-start gap-4 border border-contrast-low bg-surface-raised p-5 hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-surface">
      <input className="mt-1 size-4 accent-[var(--signal)]" defaultChecked={defaultChecked} name={name} type={type} value={value} />
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-2 block text-sm leading-6 text-contrast-medium">{description}</span>
      </span>
    </label>
  );
}

function StepFields({ query, step }: { query: Query; step: ConfigurationStep }) {
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
    return (
      <fieldset>
        <legend className="text-sm font-semibold">Vehicle mix</legend>
        <p className="mt-2 text-sm leading-6 text-contrast-medium">
          Select one or more catalogue directions. Final models and specifications remain pending.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <Choice
              defaultChecked={selected.includes(vehicle.slug)}
              description={vehicle.category}
              key={vehicle.slug}
              label={vehicle.name}
              name="mix"
              type="checkbox"
              value={vehicle.slug}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  if (step === "livery") {
    const livery = valueOf(query, "livery");
    return (
      <fieldset>
        <legend className="text-sm font-semibold">Livery direction</legend>
        <p className="mt-2 text-sm leading-6 text-contrast-medium">
          Choose a concept direction for review. Production options and requirements are confirmed later.
        </p>
        <div className="mt-6 grid gap-3">
          <Choice
            defaultChecked={livery === "operator"}
            description="Capture an operator-led colour and identity direction during review."
            label="Operator identity concept"
            name="livery"
            value="operator"
          />
          <Choice
            defaultChecked={livery === "monochrome"}
            description="Begin from a restrained black, white, and neutral vehicle direction."
            label="Monochrome concept"
            name="livery"
            value="monochrome"
          />
        </div>
      </fieldset>
    );
  }

  if (step === "package") {
    return (
      <fieldset>
        <legend className="text-sm font-semibold">Operating package</legend>
        <div className="mt-6">
          <Choice
            defaultChecked
            description="Package scope, pricing, and commercial terms will be confirmed during review."
            label="Package selection pending"
            name="package"
            value="pending"
          />
        </div>
      </fieldset>
    );
  }

  const selectedVehicles = getSelectedVehicles(query);
  const reviewRows = [
    ["City", valueOf(query, "city") || "Not selected"],
    ["Fleet size", valueOf(query, "size") || "Not selected"],
    ["Vehicle mix", selectedVehicles.map((vehicle) => vehicle.name).join(", ") || "Not selected"],
    ["Livery", valueOf(query, "livery") === "operator" ? "Operator identity concept" : valueOf(query, "livery") === "monochrome" ? "Monochrome concept" : "Not selected"],
    ["Package", "Pending confirmation"],
    ["Estimated total", "Pending confirmation"],
  ];

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
        <p className="font-semibold">Application handoff begins in Milestone 5.</p>
        <p className="mt-2 text-sm leading-6 text-contrast-medium">
          Authentication, KYC, application submission, and payment are intentionally not simulated here.
        </p>
      </div>
    </div>
  );
}

const stepIntroductions: Record<ConfigurationStep, { eyebrow: string; heading: string; copy: string }> = {
  city: { eyebrow: "01 / City", heading: "Where will the service operate?", copy: "Begin with the proposed operating market. The entry is captured for review; it does not imply current availability." },
  size: { eyebrow: "02 / Fleet size", heading: "Set the starting scale.", copy: "Record the intended number of vehicles without creating unsupported capacity or pricing promises." },
  mix: { eyebrow: "03 / Vehicle mix", heading: "Compose the proposed fleet.", copy: "Select the catalogue directions that fit the service you intend to build." },
  livery: { eyebrow: "04 / Livery", heading: "Choose an identity direction.", copy: "Capture a visual direction now, then refine it through review and production planning." },
  package: { eyebrow: "05 / Package", heading: "Hold the commercial choice clearly.", copy: "Package names, contents, and pricing require HOC confirmation, so the interface keeps them explicitly pending." },
  review: { eyebrow: "06 / Review", heading: "Check the configuration.", copy: "Review what has been captured before the application, KYC, and payment journey is connected." },
};

export default async function ConfigurePage({ params, searchParams }: PageProps<"/configure/[step]">) {
  const [{ step: rawStep }, query] = await Promise.all([params, searchParams]);
  if (!isConfigurationStep(rawStep)) notFound();

  const stepIndex = configurationSteps.findIndex((item) => item.key === rawStep);
  const nextStep = getNextStep(rawStep);
  const intro = stepIntroductions[rawStep];
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

        <div className="min-w-0 lg:col-span-3">
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

        <div className="min-w-0 lg:col-span-3">
          <StickySummary heading="Configuration" rows={summaryRows} />
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
