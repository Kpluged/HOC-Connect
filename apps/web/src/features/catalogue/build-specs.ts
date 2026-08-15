import type { Vehicle } from "./data";

/**
 * 0 = not published by the manufacturer for this vehicle - omit from
 * display rather than showing a false "0" (see Vehicle.specs jsdoc).
 * Shared by the vehicle detail page's spec section and any compact card
 * highlights list, so this filtering logic has one source of truth.
 */
export function buildSpecs(vehicle: Vehicle) {
  const { specs } = vehicle;
  return [
    specs.rangeKm > 0
      ? {
          caption: `${specs.rangeBasis} combined estimate, manufacturer-published.`,
          label: "Electric range combined",
          unit: "km",
          value: specs.rangeKm,
        }
      : null,
    specs.batteryKwh > 0
      ? { decimals: 1, label: "Battery capacity", unit: "kWh", value: specs.batteryKwh }
      : null,
    specs.powerKw > 0 ? { label: "Power", unit: "kW", value: specs.powerKw } : null,
    specs.accelSeconds > 0
      ? { decimals: 1, label: "Acceleration 0–100 km/h", unit: "s", value: specs.accelSeconds }
      : null,
    specs.topSpeedKmh > 0 ? { label: "Top speed", unit: "km/h", value: specs.topSpeedKmh } : null,
    { label: "Seating", unit: "seats", value: specs.seats },
  ].filter((spec) => spec !== null);
}
