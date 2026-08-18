import type { Metadata } from "next";

import { OwnerSpaceShell } from "@/components/owner/owner-space-shell";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

import { openTicket, updateTicket } from "./actions";

export const metadata: Metadata = {
  description: "Maintenance tickets and vehicle faults across the fleet.",
  title: "Maintenance",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export default async function MaintenancePage() {
  const organization = await getCurrentManagedOrganization();
  if (!organization) return null;

  const caller = await getServerCaller();
  const [tickets, vehicleList] = await Promise.all([
    caller.maintenance.listByOrganization({ organizationId: organization.id }),
    caller.vehicles.listByOrganization({ organizationId: organization.id }),
  ]);

  const openTickets = tickets.filter((row) => row.ticket.status !== "resolved");
  const resolvedTickets = tickets.filter((row) => row.ticket.status === "resolved");

  return (
    <OwnerSpaceShell active="maintenance" organizationName={organization.name}>
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0">
          <h2 className="text-sm font-semibold">Open tickets ({openTickets.length})</h2>
          {openTickets.length === 0 ? (
            <p className="mt-4 rounded-card border border-dashed border-contrast-low p-6 text-sm text-contrast-medium">
              No open maintenance tickets.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openTickets.map(({ ticket, vehicle }) => (
                <li className="rounded-card border border-contrast-low bg-surface p-5" key={ticket.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{ticket.title}</p>
                      <p className="mt-1 text-xs text-contrast-medium">
                        {vehicle.vehicleModelSlug}
                        {vehicle.plate ? ` · ${vehicle.plate}` : ""} · {ticket.category}
                      </p>
                      {ticket.notes ? (
                        <p className="mt-2 text-sm text-contrast-high">{ticket.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Chip variant={ticket.severity === "critical" || ticket.severity === "high" ? "live" : "neutral"}>
                        {ticket.severity}
                      </Chip>
                      <span className="text-xs text-contrast-medium">{statusLabel[ticket.status]}</span>
                    </div>
                  </div>
                  <form action={updateTicket} className="mt-4 flex flex-wrap items-center gap-3">
                    <input name="ticketId" type="hidden" value={ticket.id} />
                    <select
                      className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm"
                      defaultValue={ticket.status}
                      name="status"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <Button type="submit" variant="outline">
                      Update
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {resolvedTickets.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-contrast-medium">Resolved</h3>
              <ul className="mt-4 divide-y divide-contrast-low border-y border-contrast-low">
                {resolvedTickets.map(({ ticket, vehicle }) => (
                  <li className="flex items-center justify-between gap-4 py-3 text-sm" key={ticket.id}>
                    <span className="min-w-0 truncate">
                      {ticket.title} · {vehicle.vehicleModelSlug}
                    </span>
                    <span className="text-contrast-medium">Resolved</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="min-w-0">
          <h2 className="text-sm font-semibold">Open a ticket</h2>
          <form action={openTicket} className="mt-4 grid gap-4 rounded-card border border-contrast-low bg-surface p-5">
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
              <span className="font-medium">Title</span>
              <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" name="title" placeholder="e.g. Brake pad wear" required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Category</span>
                <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" name="category" placeholder="e.g. Brakes" required />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Severity</span>
                <select className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" defaultValue="medium" name="severity">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Notes</span>
              <textarea className="min-h-20 rounded-control border border-contrast-low bg-canvas p-3 text-sm" name="notes" placeholder="Optional detail" rows={3} />
            </label>
            <Button className="w-full sm:w-auto sm:justify-self-start" type="submit" variant="signal">
              Open ticket
            </Button>
          </form>
        </section>
      </div>
    </OwnerSpaceShell>
  );
}
