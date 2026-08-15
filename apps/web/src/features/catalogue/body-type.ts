import type { Vehicle } from "./data";

/**
 * Derives a body-type grouping from the existing free-text `category`
 * field (e.g. "Compact crossover SUV · 5 seats" -> "Compact crossover
 * SUV") rather than adding a new taxonomy field - the source data is
 * already real, this just reads the leading segment of it.
 */
export function getBodyType(category: string): string {
  return category.split("·")[0]?.trim() ?? category;
}

export function listBodyTypes(vehicles: Vehicle[]): string[] {
  const seen = new Set<string>();
  const bodyTypes: string[] = [];

  for (const vehicle of vehicles) {
    const bodyType = getBodyType(vehicle.category);
    if (!seen.has(bodyType)) {
      seen.add(bodyType);
      bodyTypes.push(bodyType);
    }
  }

  return bodyTypes;
}
