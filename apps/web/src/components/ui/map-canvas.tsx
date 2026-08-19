"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useMemo } from "react";
import Map, { Marker } from "react-map-gl/mapbox";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Lagos, the launch market - default centre when there is nothing to frame yet.
const LAGOS = { latitude: 6.5244, longitude: 3.3792, zoom: 10.4 };

export type MapMarkerKind = "driver" | "driver-active" | "pickup" | "dropoff";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: MapMarkerKind;
  label?: string;
  onClick?: () => void;
};

/**
 * Milestone 9 live map. Monochrome Mapbox style to honour the Porsche design
 * directive; Guards Red is reserved for live-signal markers only (an active
 * trip / an on-trip driver). Falls back to a static panel when no token is
 * configured, so the build and non-map environments never break.
 */
export function MapCanvas({
  markers = [],
  onMapClick,
  className = "h-[28rem]",
  interactive = true,
}: {
  markers?: MapMarker[];
  onMapClick?: (point: { lat: number; lng: number }) => void;
  className?: string;
  interactive?: boolean;
}) {
  const initialViewState = useMemo(() => {
    const located = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (located.length === 0) return LAGOS;
    const lat = located.reduce((sum, m) => sum + m.lat, 0) / located.length;
    const lng = located.reduce((sum, m) => sum + m.lng, 0) / located.length;
    return { latitude: lat, longitude: lng, zoom: located.length === 1 ? 12.5 : 11 };
  }, [markers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`relative isolate flex items-center justify-center overflow-hidden rounded-card border border-contrast-low bg-surface ${className}`}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-contrast-low" />
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-contrast-low" />
        <p className="relative z-10 max-w-[28ch] text-center text-sm text-contrast-medium">
          Live map unavailable — set <code className="text-contrast-high">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable it.
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-card border border-contrast-low ${className}`}>
      <Map
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={
          onMapClick
            ? (event: { lngLat: { lat: number; lng: number } }) =>
                onMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng })
            : undefined
        }
        style={{ width: "100%", height: "100%" }}
        {...(interactive ? {} : { interactive: false, dragPan: false, scrollZoom: false })}
      >
        {markers.map((marker) => (
          <Marker
            anchor="center"
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            onClick={marker.onClick}
          >
            <MarkerGlyph kind={marker.kind} label={marker.label} clickable={Boolean(marker.onClick)} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}

function initialsFrom(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]!)
    .join("")
    .toUpperCase();
}

/**
 * Markers stay clean at a glance so clustered points (a driver sitting on their
 * own pickup) never collide: drivers render as a compact colour-coded initials
 * badge (Guards Red only for on-trip), pickup/drop-off as small dots, and every
 * label is a hover-only tooltip rather than an always-on pill.
 */
function MarkerGlyph({
  kind,
  label,
  clickable,
}: {
  kind: MapMarkerKind;
  label?: string;
  clickable: boolean;
}) {
  const isDriver = kind === "driver" || kind === "driver-active";

  return (
    <span className={`group relative flex flex-col items-center ${clickable ? "cursor-pointer" : ""}`}>
      {isDriver ? (
        <span
          className={`flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-canvas shadow-[0_1px_5px_rgba(0,0,0,0.35)] ${
            kind === "driver-active" ? "bg-signal text-on-signal" : "bg-primary text-canvas"
          }`}
        >
          {initialsFrom(label)}
        </span>
      ) : (
        <span
          className={`block size-3.5 rounded-full shadow-[0_1px_5px_rgba(0,0,0,0.35)] ${
            kind === "pickup" ? "bg-primary ring-2 ring-canvas" : "bg-canvas ring-2 ring-primary"
          }`}
        />
      )}
      {label ? (
        <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 max-w-[12rem] -translate-x-1/2 truncate whitespace-nowrap rounded-control bg-canvas/95 px-2 py-0.5 text-[10px] font-semibold text-contrast-high opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      ) : null}
    </span>
  );
}
