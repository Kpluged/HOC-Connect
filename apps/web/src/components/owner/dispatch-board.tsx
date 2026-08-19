"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { MapMarker } from "@/components/ui/map-canvas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DispatchDriver } from "@/server/trpc/routers/drivers";
import type { DispatchTrip } from "@/server/trpc/routers/trips";

import { assignTrip, createTrip, transitionTrip } from "@/app/(owner)/space/dispatch/actions";

// mapbox-gl touches `window` at import - keep it out of the server render.
const MapCanvas = dynamic(
  () => import("@/components/ui/map-canvas").then((m) => m.MapCanvas),
  { ssr: false, loading: () => <div className="h-[26rem] rounded-card border border-contrast-low bg-surface lg:h-[32rem]" /> },
);

type AssignableDriver = { id: string; displayName: string; operationalStatus: string };
type AssignableVehicle = { id: string; label: string };
type Point = { lat: number; lng: number };

const TERMINAL = new Set(["completed", "cancelled"]);
const NEXT_STATUS: Record<string, "driver_en_route" | "driver_arrived" | "in_progress" | "completed"> = {
  assigned: "driver_en_route",
  driver_en_route: "driver_arrived",
  driver_arrived: "in_progress",
  in_progress: "completed",
};
const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  offered: "Offered",
  assigned: "Assigned",
  driver_en_route: "En route",
  driver_arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function toPoint(lat: string, lng: string): Point | null {
  if (lat.trim() === "" || lng.trim() === "") return null;
  const a = Number(lat);
  const n = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(n)) return null;
  if (a < -90 || a > 90 || n < -180 || n > 180) return null;
  return { lat: a, lng: n };
}

const coordInput =
  "min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm tabular-nums";

export function DispatchBoard({
  organizationId,
  trips,
  drivers,
  assignableDrivers,
  vehicles,
  driverPhotos,
}: {
  organizationId: string;
  trips: DispatchTrip[];
  drivers: DispatchDriver[];
  assignableDrivers: AssignableDriver[];
  vehicles: AssignableVehicle[];
  driverPhotos: Record<string, string>;
}) {
  const router = useRouter();
  // Coordinates are editable strings so keyboard users can set a ride without
  // the map; map clicks fill the same fields (accessible, no map-only path).
  const [pLat, setPLat] = useState("");
  const [pLng, setPLng] = useState("");
  const [dLat, setDLat] = useState("");
  const [dLng, setDLng] = useState("");

  const pickup = toPoint(pLat, pLng);
  const dropoff = toPoint(dLat, dLng);

  // Live: refresh the server-rendered board whenever any dispatch broadcast
  // lands on this org's private channel (another manager, or our own action).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`org:${organizationId}:dispatch`, { config: { private: true } })
      .on("broadcast", { event: "*" }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [organizationId, router]);

  const activeTrips = trips.filter((t) => !TERMINAL.has(t.status));
  const recentTrips = trips.filter((t) => TERMINAL.has(t.status)).slice(0, 8);
  const hasDemo = trips.some((t) => t.isDemo);

  const markers = useMemo<MapMarker[]>(() => {
    const driverMarkers: MapMarker[] = drivers.map((d) => ({
      id: `driver-${d.id}`,
      lat: d.lat,
      lng: d.lng,
      kind: d.operationalStatus === "on_trip" ? "driver-active" : "driver",
      label: d.displayName,
    }));
    const tripMarkers: MapMarker[] = activeTrips.map((t) => ({
      id: `trip-${t.id}`,
      lat: t.pickupLat,
      lng: t.pickupLng,
      kind: "pickup",
      label: t.pickupLabel,
    }));
    const pending: MapMarker[] = [];
    if (pickup) pending.push({ id: "pending-pickup", lat: pickup.lat, lng: pickup.lng, kind: "pickup", label: "Pickup" });
    if (dropoff) pending.push({ id: "pending-dropoff", lat: dropoff.lat, lng: dropoff.lng, kind: "dropoff", label: "Drop-off" });
    return [...driverMarkers, ...tripMarkers, ...pending];
  }, [drivers, activeTrips, pickup, dropoff]);

  function handleMapClick(point: Point) {
    const lat = point.lat.toFixed(5);
    const lng = point.lng.toFixed(5);
    if (!pickup) {
      setPLat(lat);
      setPLng(lng);
    } else if (!dropoff) {
      setDLat(lat);
      setDLng(lng);
    } else {
      setPLat(lat);
      setPLng(lng);
      setDLat("");
      setDLng("");
    }
  }

  function reset() {
    setPLat("");
    setPLng("");
    setDLat("");
    setDLng("");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Live map</p>
            <p className="mt-1 text-xs text-contrast-medium">
              {pickup ? (dropoff ? "Pickup and drop-off set — create the ride." : "Now set the drop-off (click the map or type coordinates).") : "Click the map or type coordinates to set a pickup point."}
            </p>
          </div>
          {hasDemo ? <Chip>Demo data</Chip> : null}
        </div>
        <MapCanvas markers={markers} onMapClick={handleMapClick} className="h-[26rem] lg:h-[32rem]" />

        <form action={createTrip} className="grid gap-4 rounded-card border border-contrast-low bg-surface p-5">
          <p className="text-sm font-semibold">New ride</p>
          <input name="organizationId" type="hidden" value={organizationId} />

          <fieldset className="grid gap-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-contrast-medium">Pickup</legend>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Label</span>
              <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" defaultValue="Pickup point" name="pickupLabel" required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-xs">
                <span className="text-contrast-medium">Latitude</span>
                <input aria-label="Pickup latitude" className={coordInput} inputMode="decimal" name="pickupLat" onChange={(e) => setPLat(e.target.value)} step="any" type="number" value={pLat} required />
              </label>
              <label className="grid gap-1.5 text-xs">
                <span className="text-contrast-medium">Longitude</span>
                <input aria-label="Pickup longitude" className={coordInput} inputMode="decimal" name="pickupLng" onChange={(e) => setPLng(e.target.value)} step="any" type="number" value={pLng} required />
              </label>
            </div>
          </fieldset>

          <fieldset className="grid gap-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-contrast-medium">Drop-off</legend>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Label</span>
              <input className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" defaultValue="Drop-off point" name="dropoffLabel" required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-xs">
                <span className="text-contrast-medium">Latitude</span>
                <input aria-label="Drop-off latitude" className={coordInput} inputMode="decimal" name="dropoffLat" onChange={(e) => setDLat(e.target.value)} step="any" type="number" value={dLat} required />
              </label>
              <label className="grid gap-1.5 text-xs">
                <span className="text-contrast-medium">Longitude</span>
                <input aria-label="Drop-off longitude" className={coordInput} inputMode="decimal" name="dropoffLng" onChange={(e) => setDLng(e.target.value)} step="any" type="number" value={dLng} required />
              </label>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!pickup || !dropoff} type="submit" variant="signal">
              Create ride
            </Button>
            {pLat || pLng || dLat || dLng ? (
              <button className="min-h-11 text-sm font-semibold text-contrast-medium hover:text-primary" onClick={reset} type="button">
                Reset points
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="min-w-0 space-y-6">
        <section>
          <h2 className="text-sm font-semibold">Active rides ({activeTrips.length})</h2>
          <div className="mt-4 space-y-3">
            {activeTrips.length === 0 ? (
              <p className="rounded-card border border-dashed border-contrast-low p-6 text-sm text-contrast-medium">
                No active rides. Set a pickup and drop-off, then create one.
              </p>
            ) : (
              activeTrips.map((trip) => (
                <TripCard
                  assignableDrivers={assignableDrivers}
                  driverPhotos={driverPhotos}
                  key={trip.id}
                  trip={trip}
                  vehicles={vehicles}
                />
              ))
            )}
          </div>
        </section>

        {recentTrips.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-contrast-medium">Recently closed</h2>
            <ul className="mt-4 divide-y divide-contrast-low border-y border-contrast-low">
              {recentTrips.map((trip) => (
                <li className="flex items-center justify-between gap-4 py-3 text-sm" key={trip.id}>
                  <span className="min-w-0 truncate">
                    {trip.pickupLabel} → {trip.dropoffLabel}
                  </span>
                  <span className={trip.status === "cancelled" ? "text-contrast-medium" : "font-semibold"}>
                    {STATUS_LABEL[trip.status] ?? trip.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CancelForm({ tripId }: { tripId: string }) {
  return (
    <form action={transitionTrip}>
      <input name="tripId" type="hidden" value={tripId} />
      <input name="next" type="hidden" value="cancelled" />
      <button className="min-h-11 rounded-control border border-contrast-low px-4 text-sm font-semibold text-contrast-medium hover:text-primary" type="submit">
        Cancel
      </button>
    </form>
  );
}

function TripCard({
  trip,
  assignableDrivers,
  vehicles,
  driverPhotos,
}: {
  trip: DispatchTrip;
  assignableDrivers: AssignableDriver[];
  vehicles: AssignableVehicle[];
  driverPhotos: Record<string, string>;
}) {
  const needsAssignment = trip.status === "requested" || trip.status === "offered";
  const next = NEXT_STATUS[trip.status];
  const available = assignableDrivers.filter((d) => d.operationalStatus === "available");
  const canAssign = available.length > 0 && vehicles.length > 0;
  const vehicleLabel = trip.vehiclePlate ?? trip.vehicleModel ?? null;

  return (
    <article className="rounded-card border border-contrast-low bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {trip.pickupLabel} → {trip.dropoffLabel}
          </p>
          {trip.driverName ? (
            <span className="mt-2 flex items-center gap-2">
              <Avatar
                name={trip.driverName}
                photoUrl={trip.driverId ? driverPhotos[trip.driverId] : null}
                size="xs"
              />
              <span className="min-w-0 truncate text-xs text-contrast-medium">
                {trip.driverName}
                {vehicleLabel ? ` · ${vehicleLabel}` : ""}
              </span>
            </span>
          ) : (
            <p className="mt-1 text-xs text-contrast-medium">
              Unassigned{vehicleLabel ? ` · ${vehicleLabel}` : ""}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-control bg-canvas px-2.5 py-1 text-xs font-semibold">
          {STATUS_LABEL[trip.status] ?? trip.status}
        </span>
      </div>

      {needsAssignment ? (
        canAssign ? (
          <div className="mt-4 space-y-3">
            <form action={assignTrip} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input name="tripId" type="hidden" value={trip.id} />
              <select className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" name="driverId" required>
                {available.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName}
                  </option>
                ))}
              </select>
              <select className="min-h-11 rounded-control border border-contrast-low bg-canvas px-3 text-sm" name="vehicleId" required>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="signal">
                Assign
              </Button>
            </form>
            <CancelForm tripId={trip.id} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-contrast-medium">
              {available.length === 0
                ? "No available drivers — mark a driver available on the Drivers tab."
                : "No road-ready vehicles to assign."}
            </p>
            <CancelForm tripId={trip.id} />
          </div>
        )
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {next ? (
            <form action={transitionTrip}>
              <input name="tripId" type="hidden" value={trip.id} />
              <input name="next" type="hidden" value={next} />
              <Button type="submit" variant="signal">
                Advance to {STATUS_LABEL[next]}
              </Button>
            </form>
          ) : null}
          <CancelForm tripId={trip.id} />
        </div>
      )}
    </article>
  );
}
