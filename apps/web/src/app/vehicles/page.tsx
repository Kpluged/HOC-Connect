import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { SiteHeader } from "@/components/ui/site-header";
import { vehicles } from "@/features/catalogue/data";

export const metadata: Metadata = {
  description: "Explore the current HOC Elite Wheels electric vehicle catalogue direction.",
  title: "Vehicles",
};

export default function VehiclesPage() {
  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <header className="page-shell border-b border-contrast-low py-20 lg:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">Catalogue</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <h1 className="max-w-[10ch] text-[clamp(4rem,9vw,8rem)] font-semibold leading-[0.86] tracking-[-0.06em] lg:col-span-8">
            Electric vehicles, clearly considered.
          </h1>
          <p className="max-w-[42ch] text-base leading-7 text-contrast-high lg:col-span-4">
            Manufacturer specifications are shown for each model below. HOC&apos;s pricing, availability, and confirmed procurement trim for Lagos remain pending.
          </p>
        </div>
      </header>
      <section className="page-shell py-16 lg:py-24">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-contrast-low pb-5">
          <p className="text-sm font-semibold">All vehicles</p>
          <p className="tabular-nums text-sm text-contrast-medium">{vehicles.length} vehicles</p>
        </div>
        <div className="grid gap-x-7 gap-y-16 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard
              detail={vehicle.category}
              href={`/vehicles/${vehicle.slug}`}
              image={vehicle.image}
              key={vehicle.slug}
              name={vehicle.name}
            />
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
