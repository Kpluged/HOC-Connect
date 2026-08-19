export type LatLng = { lat: number; lng: number };

export type TripMapProps = {
  pickup: LatLng & { label: string };
  dropoff: LatLng & { label: string };
  /** The driver's live position, when known. */
  driver?: LatLng | null;
  height?: number;
};
