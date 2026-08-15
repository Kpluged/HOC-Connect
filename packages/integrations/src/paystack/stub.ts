import type {
  InitializeTransactionInput,
  InitializeTransactionResult,
  PaystackAdapter,
  VerifyTransactionResult,
} from "./types";

/**
 * Unlike Prembly's stub (which can meaningfully return "pending"), a
 * payment has no equivalent safe placeholder state - a stub that "succeeded"
 * would fabricate money movement that never happened. So this adapter
 * throws rather than pretending, and call sites must check isPaystackLive()
 * before offering payment at all (see ./index.ts). verifyWebhookSignature
 * always returns false so no unconfigured secret is ever trusted.
 */
export function createStubPaystackAdapter(): PaystackAdapter {
  return {
    async initializeTransaction(
      _input: InitializeTransactionInput,
    ): Promise<InitializeTransactionResult> {
      throw new Error(
        "Paystack is not configured yet (PAYSTACK_ADAPTER_MODE=stub). " +
          "Online payment is not available - contact HOC staff.",
      );
    },

    async verifyTransaction(
      _reference: string,
    ): Promise<VerifyTransactionResult> {
      throw new Error(
        "Paystack is not configured yet (PAYSTACK_ADAPTER_MODE=stub). " +
          "Online payment is not available - contact HOC staff.",
      );
    },

    verifyWebhookSignature(_rawBody: string, _signature: string): boolean {
      return false;
    },
  };
}
