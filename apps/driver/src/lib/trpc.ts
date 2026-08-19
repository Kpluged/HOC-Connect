import { config } from "./config";
import { supabase } from "./supabase";

/**
 * Minimal typed client for the web app's tRPC HTTP endpoint. We speak the batch
 * wire format directly (superjson-compatible {json} envelopes for the plain
 * inputs/outputs the driver app uses) rather than pulling the server's type
 * graph across the app boundary. Every request carries the session's bearer
 * token, which the server verifies in createContext.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "content-type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function call<TOut>(
  path: string,
  input: unknown,
  kind: "query" | "mutation",
): Promise<TOut> {
  const headers = await authHeaders();
  const body = JSON.stringify({ "0": { json: input ?? null } });

  const res =
    kind === "query"
      ? await fetch(`${config.trpcUrl}/${path}?batch=1&input=${encodeURIComponent(body)}`, {
          headers,
        })
      : await fetch(`${config.trpcUrl}/${path}?batch=1`, { method: "POST", headers, body });

  const payload = (await res.json()) as {
    result?: { data?: { json: TOut } };
    error?: { json?: { message?: string } } | { message?: string };
  }[];
  const item = payload?.[0];
  if (!item || item.error) {
    const message =
      (item?.error && "json" in item.error ? item.error.json?.message : undefined) ??
      (item?.error && "message" in item.error ? item.error.message : undefined) ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return item.result!.data!.json;
}

export type DriverMe = {
  id: string;
  displayName: string;
  operationalStatus: "offline" | "available" | "on_trip";
  organizationId: string;
  photoPath: string | null;
  lat: number | null;
  lng: number | null;
} | null;

export type DriverTrip = {
  id: string;
  status: string;
  pickupLabel: string;
  dropoffLabel: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  driverId: string | null;
  vehicleId: string | null;
  requestedAt: string;
};

export const api = {
  driverMe: () => call<DriverMe>("drivers.me", undefined, "query"),
  myTrips: () => call<DriverTrip[]>("trips.mine", undefined, "query"),
  reportLocation: (input: {
    lat: number;
    lng: number;
    operationalStatus?: "offline" | "available";
  }) => call<{ ok: true }>("drivers.reportLocation", input, "mutation"),
  acceptOffer: (tripId: string) => call<DriverTrip>("trips.accept", { tripId }, "mutation"),
  declineOffer: (tripId: string) => call<DriverTrip>("trips.decline", { tripId }, "mutation"),
  transitionTrip: (input: { tripId: string; next: string }) =>
    call<DriverTrip>("trips.transition", input, "mutation"),
};
