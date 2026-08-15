export const applicationSteps = [
  { key: "identity", label: "Identity" },
  { key: "company", label: "Company" },
  { key: "documents", label: "Documents" },
  { key: "review", label: "Review" },
] as const;

export type ApplicationStep = (typeof applicationSteps)[number]["key"];

export function isApplicationStep(value: string): value is ApplicationStep {
  return applicationSteps.some((step) => step.key === value);
}

export const requiredDocumentKinds = [
  {
    description: "A government-issued ID confirming your identity.",
    kind: "government_id",
    label: "Government-issued ID",
  },
  {
    description: "A recent utility bill or bank statement showing your address.",
    kind: "proof_of_address",
    label: "Proof of address",
  },
  {
    description: "Certificate of incorporation or equivalent registration document.",
    kind: "company_registration",
    label: "Company registration",
  },
  {
    description: "Most recent tax clearance certificate or filing.",
    kind: "tax_document",
    label: "Tax document",
  },
] as const;
