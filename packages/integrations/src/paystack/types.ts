/**
 * Our own abstraction, not a mirror of Paystack's real API - narrowed to
 * exactly what the orders/payments flow needs (see
 * packages/integrations/src/prembly/types.ts for the same reasoning).
 */
export type InitializeTransactionInput = {
  amountMinor: number;
  callbackUrl: string;
  currency: string;
  email: string;
  reference: string;
};

export type InitializeTransactionResult = {
  authorizationUrl: string;
  reference: string;
};

export type PaystackTransactionStatus = "success" | "failed" | "abandoned";

export type VerifyTransactionResult = {
  amountMinor: number;
  currency: string;
  reference: string;
  status: PaystackTransactionStatus;
};

export interface PaystackAdapter {
  initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult>;
  verifyTransaction(reference: string): Promise<VerifyTransactionResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
