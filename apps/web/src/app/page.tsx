import Image from "next/image";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HeroVideo } from "@/components/motion/hero-video";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SiteHeader } from "@/components/ui/site-header";
import { VehicleCard } from "@/components/ui/vehicle-card";
import { vehicles } from "@/features/catalogue/data";

const operatingLoop = [
  {
    copy: "Choose a city and shape the proposed fleet around the service you want to operate.",
    label: "Discover",
  },
  {
    copy: "Define fleet size, vehicle mix, livery direction, and the operating package.",
    label: "Configure & apply",
  },
  {
    copy: "Complete review, approval, and provisioning before the fleet enters service.",
    label: "Approve & provision",
  },
  {
    copy: "Manage the fleet, live dispatch, drivers, orders, and reporting from one connected space.",
    label: "Operate & earn",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader overlay />

      <section className="relative isolate min-h-[100svh] overflow-hidden border-b border-contrast-low bg-[#07090c]">
        <HeroVideo
          className="absolute inset-0"
          poster="/vehicles/hero-saloon-side-v1.png"
          src="/hero/home-hero.mp4"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/75" />

        <div className="page-shell relative flex min-h-[100svh] flex-col items-center justify-center pb-16 pt-36 text-center text-white sm:pt-40 lg:pb-20 lg:pt-44">
          <div className="room-enter relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/68">Electric ride-service platform</p>
            <h1 className="mt-5 max-w-[14ch] text-[clamp(3.4rem,7vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
              Build the fleet. Run the service.
            </h1>
          </div>

          <div className="room-enter relative z-10 mt-10 flex max-w-2xl flex-col items-center">
            <p className="text-lg leading-8 text-white/85">
              Choose the city, shape a fleet, apply, and manage dispatch from one connected space.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/configure/city" variant="signal">Configure a fleet</ButtonLink>
              <ButtonLink href="/vehicles" variant="glass">Explore vehicles</ButtonLink>
            </div>
            <p className="mt-6 text-xs text-white/55">Vehicle specifications and availability pending HOC confirmation.</p>
          </div>
        </div>
      </section>

      <section className="page-shell py-24 lg:py-36">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Current catalogue direction"
            heading="City, everyday, and premium. One operating system."
            number="01"
          />
          <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.slice(0, 4).map((vehicle) => (
              <VehicleCard
                detail={vehicle.category}
                href={`/vehicles/${vehicle.slug}`}
                image={vehicle.image}
                imageFit={vehicle.imageFit}
                key={vehicle.slug}
                name={vehicle.name}
              />
            ))}
          </div>
          <div className="mt-12">
            <ButtonLink href="/vehicles" variant="outline">
              View all vehicles
            </ButtonLink>
          </div>
        </ScrollReveal>
      </section>

      <section className="bg-canvas py-24 text-primary lg:py-36" data-room="dark">
        <div className="page-shell">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
              The operating loop
            </p>
            <h2 className="mt-6 max-w-[12ch] text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
              From first choice to live dispatch.
            </h2>
            <ol className="mt-20 grid border-t border-contrast-low md:grid-cols-2 lg:grid-cols-4">
              {operatingLoop.map((step, index) => (
                <li className="border-b border-contrast-low py-8 md:px-6 md:first:pl-0 lg:border-r lg:last:border-r-0" key={step.label}>
                  <p className="tabular-nums text-xs text-contrast-medium">0{index + 1}</p>
                  <h3 className="mt-10 text-xl font-semibold">{step.label}</h3>
                  <p className="mt-4 text-sm leading-6 text-contrast-high">{step.copy}</p>
                </li>
              ))}
            </ol>
            <ButtonLink className="mt-12" href="/how-it-works" variant="outline">
              See how it works
            </ButtonLink>
          </ScrollReveal>
        </div>
      </section>

      <section className="page-shell py-24 lg:py-36">
        <ScrollReveal>
          <div className="relative min-h-[34rem] overflow-hidden lg:min-h-[46rem]">
            <Image
              alt="A proposed electric vehicle fleet in an urban setting"
              className="object-cover"
              fill
              quality={90}
              sizes="100vw"
              src="/vehicles/lineup-03.jpg"
            />
            <div className="absolute inset-x-0 bottom-0 grid gap-6 bg-canvas p-7 md:grid-cols-2 md:p-10">
              <h2 className="max-w-[12ch] text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
                Shape the service before it moves.
              </h2>
              <div className="md:self-end md:justify-self-end">
                <p className="max-w-[38ch] text-base leading-7 text-contrast-high">
                  The configurator captures the proposed operating city, fleet size, vehicle mix, livery, and package in one reviewable path.
                </p>
                <ButtonLink className="mt-7" href="/configure/city" variant="signal">
                  Begin configuration
                </ButtonLink>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
