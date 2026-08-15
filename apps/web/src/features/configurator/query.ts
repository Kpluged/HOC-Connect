import type { SearchParams } from "@/lib/search-params";
import { vehicles } from "@/features/catalogue/data";

export function valueOf(query: SearchParams, key: string) {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
}

export function valuesOf(query: SearchParams, key: string) {
  const value = query[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function getSelectedVehicles(query: SearchParams) {
  const selected = valuesOf(query, "mix");
  const initialVehicle = valueOf(query, "vehicle");
  const slugs = selected.length > 0 ? selected : initialVehicle ? [initialVehicle] : [];
  return vehicles.filter((vehicle) => slugs.includes(vehicle.slug));
}
