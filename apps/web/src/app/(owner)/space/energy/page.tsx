import type { Metadata } from "next";

import { OwnerSpaceShell } from "@/components/owner/owner-space-shell";
import { Button } from "@/components/ui/button";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

import { logCharging } from "./actions";

export const metadata: Metadata = {
  description: "Charging sessions and energy cost across the fleet.",
  title: "Energy",
};

function formatMoney(minor: number | null, currency: string | null): string {
  if (minor === null || currency === null) return "—";
  return `${currency} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default async function EnergyPage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const [sessions, vehicleList] = await Promise.all([
    caller.energy.listByOrganization({ organizationId: organization.id }),
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
  ]);

  const totalKwh = sessions.reduce((sum, row) => sum + (row.session.energyWh ?? 0), 0) / 1000;
  // Lagos launch market trades in the Naira; used only when the org row hasn't
  // recorded its own currency yet.
  const currency = organization.currency ?? "NGN";

  return (
    <OwnerSpaceShell active="energy" organizationName={organization.name}>
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold">Charging sessions ({sessions.length})</h2>
            <p className="text-xs text-contrast-medium">
              {totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh logged
            </p>
          </div>

          {sessions.length === 0 ? (
            <p className="mt-4 rounded-card border border-dashed border-contrast-low p-6 text-sm text-contrast-medium">
              No charging sessions logged yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-contrast-low border-y border-contrast-low">
              {sessions.map(({ session, vehicle }) => (
                <li className="grid gap-1 py-4 sm:grid-cols-[1fr_auto]" key={session.id}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {vehicle.vehicleModelSlug}
                      {vehicle.plate ? ` · ${vehicle.plate}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-contrast-medium">
                      {session.locationLabel ?? "Location not recorded"} ·{" "}
                      {new Date(session.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="font-semibold tabular-nums">
                      {session.energyWh !== null
                        ? `${(session.energyWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`
                        : "—"}
                    </p>
                    <p className="text-xs text-contrast-medium tabular-nums">
                      {formatMoney(session.costMinor, session.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0">
          <h2 className="text-sm font-semibold">Log a session</h2>
          <form action={logCharging} className="mt-4 grid gap-4 rounded-card border border-contrast-low bg-surface p-5">
            <input name="organizationId" type="hidden" value={organization.id} />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Vehicle</span>
              <select className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" name="vehicleId" required>
                {vehicleList.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleModelSlug}
                    {vehicle.plate ? ` · ${vehicle.plate}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Location</span>
              <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" name="locationLabel" placeholder="e.g. Lekki hub" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Energy (kWh)</span>
                <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" inputMode="decimal" name="energyKwh" placeholder="0" />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Cost</span>
                <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" inputMode="decimal" name="costMajor" placeholder="0.00" />
              </label>
            </div>
            <input name="currency" type="hidden" value={currency} />
            <p className="text-xs text-contrast-medium">
              Cost is recorded in {currency}. Amounts you enter here are your own operating records.
            </p>
            <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
              Log session
            </Button>
          </form>
        </section>
      </div>
    </OwnerSpaceShell>
  );
}
