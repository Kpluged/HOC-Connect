export type IntegrationName = "paystack" | "prembly" | "mapbox";

export interface IntegrationAdapter {
  readonly name: IntegrationName;
}
