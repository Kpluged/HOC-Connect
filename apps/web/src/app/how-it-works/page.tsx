import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";

export const metadata: Metadata = {
  description: "The proposed HOC Connect journey from fleet configuration through live operations.",
  title: "How it works",
};

const stages = [
  {
    body: "Review the vehicle catalogue, choose an operating city, and determine the shape of the proposed service.",
    number: "01",
    title: "Discover",
  },
  {
    body: "Capture fleet size, vehicle mix, livery direction, and package in a structured application.",
    number: "02",
    title: "Configure & apply",
  },
  {
    body: "Move through identity checks, review, commercial approval, payment, and fleet provisioning.",
    number: "03",
    title: "Approve & provision",
  },
  {
    body: "Use the connected owner, dispatch, driver, and administration surfaces to operate the service.",
    number: "04",
    title: "Operate & earn",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <header className="page-shell py-20 lg:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">One connected journey</p>
        <h1 className="mt-8 max-w-[10ch] text-[clamp(4rem,9vw,8.5rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
          From intent to operation.
        </h1>
        <p className="mt-9 max-w-[48ch] text-lg leading-8 text-contrast-high">
          HOC Connect joins public discovery, fleet application, live operations, and administration without treating them as separate products.
        </p>
      </header>

      <section className="border-y border-contrast-low bg-surface">
        <ol className="page-shell">
          {stages.map((stage) => (
            <li className="grid gap-8 border-b border-contrast-low py-14 last:border-b-0 md:grid-cols-12 lg:py-20" key={stage.number}>
              <p className="tabular-nums text-sm text-contrast-medium md:col-span-2">{stage.number}</p>
              <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em] md:col-span-5">
                {stage.title}
              </h2>
              <p className="max-w-[42ch] text-base leading-7 text-contrast-high md:col-span-5 md:self-end">
                {stage.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="page-shell grid gap-8 py-24 lg:grid-cols-12 lg:py-32">
        <h2 className="max-w-[13ch] text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.055em] lg:col-span-8">
          Start with the decisions that shape the fleet.
        </h2>
        <div className="lg:col-span-4 lg:self-end">
          <p className="text-sm leading-6 text-contrast-medium">
            Submitting the configuration and completing KYC will be connected in Milestone 5.
          </p>
          <ButtonLink className="mt-7" href="/configure/city" variant="signal">
            Configure a fleet
          </ButtonLink>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
