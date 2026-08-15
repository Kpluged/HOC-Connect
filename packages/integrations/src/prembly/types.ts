/**
 * Our own abstraction, not a mirror of Prembly's real API - we have no
 * docs/credentials for that yet, and inventing a specific-but-fake Prembly
 * contract would violate the no-invented-facts guardrail as much as
 * inventing a price would.
 */
export type KycDocumentInput = {
  kind: string;
  storagePath: string;
};

export type KycSubjectInput = {
  applicationId: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  documents: KycDocumentInput[];
  fullName: string;
};

export type KycVerificationStatus =
  | "pending"
  | "verified"
  | "flagged"
  | "failed";

export type KycVerificationResult = {
  checkedAt: string;
  providerReference: string;
  status: KycVerificationStatus;
};

export interface PremblyAdapter {
  getVerificationStatus(
    providerReference: string,
  ): Promise<KycVerificationResult>;
  submitForVerification(input: KycSubjectInput): Promise<KycVerificationResult>;
}
