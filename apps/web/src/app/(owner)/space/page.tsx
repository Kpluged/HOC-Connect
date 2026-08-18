import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { KpiTile } from "@/components/ui/kpi-tile";
import { SiteHeader } from "@/components/ui/site-header";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Fleet overview: drivers, vehicles, and active assignments.",
  title: "Owner Space",
};

export default async function OwnerSpaceOverviewPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const [driverList, vehicleList, activeShifts] = await Promise.all([
    caller.drivers.listByOrganization({ organizationId: organization.id }),
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
    caller.shifts.listActiveByOrganization({ organizationId: organization.id }),
  ]);

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell py-16 lg:py-24">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Owner Space
          </p>
          <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            {organization.name}
          </h1>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Drivers" value={driverList.length} />
          <KpiTile label="Vehicles" value={vehicleList.length} />
          <KpiTile label="Active assignments" value={activeShifts.length} />
          <KpiTile
            label="Trips"
            note="Arriving in Milestone 9 (dispatch)."
            value="—"
          />
          <KpiTile
            label="Earnings"
            note="Arriving in Milestone 10 (fleet intelligence)."
            value="—"
          />
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
