import type { KycSubjectInput, KycVerificationResult, PremblyAdapter } from "./types";

/**
 * Always returns "pending", never fabricates "verified" - a stub that
 * auto-approved KYC would let applications silently bypass identity
 * verification, which is wrong for a compliance-sensitive flow. With this
 * adapter active, every application requires an explicit human HOC-staff
 * decision (see docs/staff-bootstrap.md and the /admin/applications review
 * queue) - nothing auto-approves.
 */
export function createStubPremblyAdapter(): PremblyAdapter {
  return {
    async getVerificationStatus(providerReference) {
      return {
        checkedAt: new Date().toISOString(),
        providerReference,
        status: "pending",
      };
    },

    async submitForVerification(input: KycSubjectInput) {
      const result: KycVerificationResult = {
        checkedAt: new Date().toISOString(),
        providerReference: `stub_${input.applicationId}`,
        status: "pending",
      };
      return result;
    },
  };
}
