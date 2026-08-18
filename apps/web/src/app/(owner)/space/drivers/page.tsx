import type { Metadata } from "next";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { Field } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

import { createDriver } from "./actions";

export const metadata: Metadata = {
  description: "Driver roster for your fleet.",
  title: "Drivers",
};

const statusVariant = {
  active: "live",
  disabled: "inactive",
  invited: "neutral",
} as const;

export default async function OwnerDriversPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const driverList = await caller.drivers.listByOrganization({
    organizationId: organization.id,
  });

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell py-16 lg:py-24">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Owner Space
          </p>
          <h1 className="mt-5 text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Drivers
          </h1>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-5">
            <p className="text-sm font-semibold">Add a driver</p>
            <form action={createDriver} className="mt-4 grid gap-6">
              <input name="organizationId" type="hidden" value={organization.id} />
              <Field id="displayName" label="Name" name="displayName" required />
              <Field id="phone" label="Phone" name="phone" />
              <Field
                description="Optional - if the driver has already completed a licence check."
                id="licenceReference"
                label="Licence reference"
                name="licenceReference"
              />
              <Button className="justify-self-start" type="submit" variant="signal">
                Add driver
              </Button>
            </form>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <p className="text-sm font-semibold">Roster</p>
            {driverList.length > 0 ? (
              <div className="mt-4">
                <DataTable
                  caption="Drivers in this organization"
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "phone", label: "Phone" },
                    { key: "status", label: "Status" },
                    { align: "right", key: "action", label: "" },
                  ]}
                  rows={driverList.map((driver) => ({
                    id: driver.id,
                    values: {
                      action: (
                        <Link
                          className="text-sm font-semibold underline-offset-4 hover:underline"
                          href={`/space/drivers/${driver.id}`}
                        >
                          View
                        </Link>
                      ),
                      name: driver.displayName,
                      phone: driver.phone || "-",
                      status: (
                        <Chip variant={statusVariant[driver.status]}>{driver.status}</Chip>
                      ),
                    },
                  }))}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-contrast-medium">No drivers added yet.</p>
            )}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
