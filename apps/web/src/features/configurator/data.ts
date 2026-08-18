export const configurationSteps = [
  { key: "city", label: "City" },
  { key: "size", label: "Fleet size" },
  { key: "mix", label: "Vehicle mix" },
  { key: "package", label: "Package" },
  { key: "review", label: "Review" },
] as const;

export type ConfigurationStep = (typeof configurationSteps)[number]["key"];

export function isConfigurationStep(value: string): value is ConfigurationStep {
  return configurationSteps.some((step) => step.key === value);
}

export function getNextStep(step: ConfigurationStep) {
  const index = configurationSteps.findIndex((item) => item.key === step);
  return configurationSteps[index + 1]?.key;
}
