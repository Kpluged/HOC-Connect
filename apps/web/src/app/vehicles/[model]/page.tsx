import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";
import { getVehicle, vehicles } from "@/features/catalogue/data";

export function generateStaticParams() {
  return vehicles.map((vehicle) => ({ model: vehicle.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/vehicles/[model]">): Promise<Metadata> {
  const { model } = await params;
  const vehicle = getVehicle(model);

  if (!vehicle) return {};

  return {
    description: `${vehicle.name} catalogue detail for HOC Connect. Specifications remain pending confirmation.`,
    title: vehicle.name,
  };
}

const specs = [
  { label: "Estimated range", value: "Pending" },
  { label: "Battery", value: "Pending" },
  { label: "Seating", value: "Pending" },
];

export default async function VehicleDetailPage({
  params,
}: PageProps<"/vehicles/[model]">) {
  const { model } = await params;
  const vehicle = getVehicle(model);

  if (!vehicle) notFound();

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <div className="sticky top-0 z-30 border-b border-contrast-low bg-canvas/95 backdrop-blur-sm">
        <div className="page-shell flex min-h-14 items-center justify-between gap-5 text-sm">
          <div className="flex items-center gap-4">
            <Link className="text-contrast-medium hover:text-primary" href="/vehicles">
              Vehicles
            </Link>
            <span aria-hidden="true" className="text-contrast-low">/</span>
            <span className="font-semibold">{vehicle.name}</span>
          </div>
          <Link className="font-semibold underline-offset-4 hover:underline" href="#specifications">
            Specifications
          </Link>
        </div>
      </div>

      <section className="relative isolate overflow-hidden border-b border-contrast-low bg-canvas">
        <div className="absolute inset-x-0 top-0 h-[45%] overflow-hidden bg-[#07090c]">
          <Image
            alt="Electric fleet atmosphere"
            className="scale-105 object-cover saturate-50"
            fill
            loading="eager"
            quality={90}
            sizes="100vw"
            src="/vehicles/lineup-02.jpg"
          />
          <div className="absolute inset-0 bg-[#07090c]/64" />
        </div>

        <div className="page-shell relative flex min-h-[calc(100dvh-8.5rem)] flex-col items-center pb-16 pt-12 text-center lg:pb-20 lg:pt-16">
          <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">HOC Connect vehicle catalogue</p>
          <div className="relative z-10 -mt-1 h-[clamp(19rem,46vw,38rem)] w-full max-w-6xl sm:-mt-8">
            <Image
              alt={`${vehicle.name} electric vehicle product cut-out`}
              className="object-contain drop-shadow-[0_24px_18px_rgba(0,0,0,0.2)]"
              fill
              loading="eager"
              quality={90}
              sizes="(min-width: 1280px) 1152px, 94vw"
              src={vehicle.image}
            />
          </div>
          <div className="relative z-10 -mt-4 flex max-w-2xl flex-col items-center sm:-mt-12 lg:-mt-16">
            <span className="rounded-control bg-surface px-4 py-1.5 text-xs font-semibold">Electric</span>
            <h1 className="mt-5 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.06em]">{vehicle.name}</h1>
            <p className="mt-6 max-w-[48ch] text-base leading-7 text-contrast-high">
              This vehicle is presented as a catalogue direction. Final model designation, commercial terms, and technical data remain pending HOC confirmation.
            </p>
            <ButtonLink className="mt-8" href={`/configure/city?vehicle=${vehicle.slug}`} variant="signal">Add to configuration</ButtonLink>
          </div>
        </div>
      </section>

      <section className="border-y border-contrast-low bg-surface" id="specifications">
        <div className="page-shell py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">Technical overview</p>
              <h2 className="mt-5 max-w-[10ch] text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
                Data without guesswork.
              </h2>
            </div>
            <dl className="grid border-t border-contrast-low sm:grid-cols-3 lg:col-span-8">
              {specs.map((spec) => (
                <div className="border-b border-contrast-low py-7 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0" key={spec.label}>
                  <dt className="text-sm text-contrast-medium">{spec.label}</dt>
                  <dd className="mt-14 text-2xl font-semibold">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-8 text-sm leading-6 text-contrast-medium">
            No provisional specifications are displayed. Confirmed values can be connected to the catalogue data model in a later milestone.
          </p>
        </div>
      </section>

      <section className="page-shell grid gap-8 py-24 lg:grid-cols-12 lg:py-32">
        <h2 className="max-w-[12ch] text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.055em] lg:col-span-8">
          Put this vehicle into a proposed fleet.
        </h2>
        <div className="lg:col-span-4 lg:self-end">
          <p className="max-w-[38ch] text-base leading-7 text-contrast-high">
            Continue into the configurator to define the city, fleet size, mix, livery, and package.
          </p>
          <ButtonLink className="mt-7" href={`/configure/city?vehicle=${vehicle.slug}`} variant="signal">
            Start with {vehicle.name}
          </ButtonLink>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
