import type { Metadata } from "next";

import { Button, ButtonLink } from "@/components/ui/button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { Chip } from "@/components/ui/chip";
import { ConfigStepRail } from "@/components/ui/config-step-rail";
import { DataTable } from "@/components/ui/data-table";
import { Explainer } from "@/components/ui/explainer";
import { Field, SelectField } from "@/components/ui/field";
import { Footnotes } from "@/components/ui/footnotes";
import { PersonIcon } from "@/components/ui/icons";
import { KpiTile } from "@/components/ui/kpi-tile";
import { MapPanel } from "@/components/ui/map-panel";
import { OverlayNav } from "@/components/ui/overlay-nav";
import { SectionHeader } from "@/components/ui/section-header";
import { SignalLine } from "@/components/ui/signal-line";
import { SiteHeader } from "@/components/ui/site-header";
import { SpecBlock } from "@/components/ui/spec-block";
import { StatusDot } from "@/components/ui/status-dot";
import { StickySummary } from "@/components/ui/sticky-summary";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { getBodyType } from "@/features/catalogue/body-type";
import { buildSpecs } from "@/features/catalogue/build-specs";
import { vehicles } from "@/features/catalogue/data";

export const metadata: Metadata = {
  title: "Interface system",
};

type RoomName = "light" | "dark";

export default function StyleguidePage() {
  return (
    <main className="bg-canvas" data-room="dark">
      <SiteHeader />
      <header className="page-shell room-enter py-24">
        <BrandWordmark className="text-3xl leading-none text-contrast-medium" />
        <h1 className="mt-6 max-w-[9ch] text-[clamp(4rem,10vw,8rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
          Interface system
        </h1>
        <p className="mt-8 max-w-[52ch] text-base leading-7 text-contrast-high">
          Locked tokens and primitives shown in both declared rooms. This route
          contains implementation labels only, not public brand copy.
        </p>
      </header>

      <ComponentRoom name="light" number="01" />
      <ComponentRoom name="dark" number="02" />
    </main>
  );
}

function ComponentRoom({ name, number }: { name: RoomName; number: string }) {
  return (
    <section
      className="bg-canvas py-24 text-primary"
      data-room={name}
      id={`${name}-room`}
    >
      <div className="page-shell grid gap-24">
        <SectionHeader
          eyebrow="Declared page context"
          heading={`${name === "light" ? "Light" : "Dark"} room`}
          number={number}
        />

        <Sample label="Actions and status">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary action</Button>
            <Button variant="secondary">Secondary action</Button>
            <Button variant="outline">Outline action</Button>
            <Button variant="text">Text action</Button>
            <Button variant="signal">Live action</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Chip>Neutral</Chip>
            <Chip variant="selected">Selected</Chip>
            <Chip variant="live">Live</Chip>
            <Chip variant="inactive">Inactive</Chip>
            <StatusDot label="Live state" live />
            <StatusDot label="Awaiting state" />
            <span className="inline-flex items-center gap-2 text-sm text-contrast-high">
              <PersonIcon className="size-5" />
              Person icon
            </span>
          </div>
        </Sample>

        <Sample label="Navigation and configuration">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-contrast-high">Overlay navigation</p>
            <OverlayNav />
          </div>
          <div className="mt-10">
            <ConfigStepRail
              steps={[
                { label: "City", state: "complete" },
                { label: "Size", state: "current" },
                { label: "Mix", state: "upcoming" },
                { label: "Review", state: "upcoming" },
              ]}
            />
          </div>
        </Sample>

        <Sample label="Inputs and explanations">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              description="Supporting guidance appears here."
              id={`${name}-text-field`}
              label="Text field"
              placeholder="Enter a value"
            />
            <SelectField id={`${name}-select-field`} label="Select field">
              <option>Choose an option</option>
            </SelectField>
            <Field
              id={`${name}-file-field`}
              label="File field"
              type="file"
            />
            <Field
              error="This example shows the error state."
              id={`${name}-error-field`}
              label="Error state"
            />
          </div>
          <div className="mt-8">
            <Explainer term="Utilisation">
              The share of available time that a vehicle is in active service.
            </Explainer>
          </div>
        </Sample>

        <Sample label="Vehicle and specification">
          <div className="grid gap-10 md:grid-cols-2">
            <VehicleCard
              detail="Class pending"
              href="#vehicle-sample"
              image="/vehicles/model-01.jpg"
              name="Model name pending"
            />
            <div className="grid content-start gap-10">
              <SpecBlock
                caption="Verified source data has not been connected."
                footnote="1"
                label="Specification"
                unit="unit"
                value="—"
              />
              <Footnotes
                items={[
                  {
                    id: `${name}-source-note`,
                    text: "Values remain unavailable until a verified source is connected.",
                  },
                ]}
              />
            </div>
          </div>
          <div className="mt-10">
            <p className="mb-4 text-xs text-contrast-medium">
              Expanded card - metadata pills, compact spec row, dual CTA
              (used by ChangeModelPanel)
            </p>
            <div className="max-w-sm">
              <VehicleCard
                bodyType={getBodyType(vehicles[0].category)}
                detail={vehicles[0].category}
                href="#vehicle-sample"
                image={vehicles[0].image}
                manufacturer={vehicles[0].manufacturer}
                name={vehicles[0].name}
                secondaryHref="#configure-sample"
                segment={vehicles[0].segment}
                specs={buildSpecs(vehicles[0])}
              />
            </div>
          </div>
        </Sample>

        <Sample label="Operational surfaces">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Revenue",
              "Trips",
              "Utilisation",
              "Energy cost",
            ].map((label) => (
              <KpiTile key={label} label={label} note="Awaiting telemetry" value="—" />
            ))}
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <MapPanel label="Map component preview">
              <Chip>Mapbox adapter slot</Chip>
            </MapPanel>
            <StickySummary
              action={
                <ButtonLink className="w-full" href="#summary" variant="outline">
                  Continue
                </ButtonLink>
              }
              heading="Summary"
              rows={[
                { label: "City", value: "Not selected" },
                { label: "Fleet", value: "—" },
                { label: "Total", value: "—" },
              ]}
            />
          </div>
          <div className="mt-8">
            <DataTable
              caption="Operational table example"
              columns={[
                { key: "vehicle", label: "Vehicle" },
                { key: "driver", label: "Driver" },
                { align: "right", key: "status", label: "Status" },
              ]}
              rows={[
                {
                  id: "sample-row",
                  values: {
                    driver: "Unassigned",
                    status: <Chip variant="inactive">Awaiting data</Chip>,
                    vehicle: "Sample record",
                  },
                },
              ]}
            />
          </div>
        </Sample>

        <Sample label="Signal line">
          <div className="flex gap-16">
            <div>
              <p className="mb-4 text-xs text-contrast-medium">Structural</p>
              <SignalLine />
            </div>
            <div>
              <p className="mb-4 text-xs text-contrast-medium">Live only</p>
              <SignalLine live />
            </div>
          </div>
        </Sample>
      </div>
    </section>
  );
}

function Sample({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <section>
      <h2 className="mb-8 border-b border-contrast-low pb-4 text-sm font-semibold">
        {label}
      </h2>
      {children}
    </section>
  );
}
