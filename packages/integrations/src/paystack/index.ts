import "server-only";
import { getServerEnv } from "@hoc/config/server";

import { createStubPaystackAdapter } from "./stub";
import type { PaystackAdapter } from "./types";

export type {
  InitializeTransactionInput,
  InitializeTransactionResult,
  PaystackAdapter,
  PaystackTransactionStatus,
  VerifyTransactionResult,
} from "./types";

let cached: PaystackAdapter | undefined;

/**
 * Swap point: once real Paystack credentials exist, add `./live.ts`
 * implementing PaystackAdapter and set PAYSTACK_ADAPTER_MODE=live. Call
 * sites never change.
 */
export function getPaystackAdapter(): PaystackAdapter {
  if (cached) return cached;

  const { PAYSTACK_ADAPTER_MODE } = getServerEnv();

  if (PAYSTACK_ADAPTER_MODE === "live") {
    throw new Error(
      "PAYSTACK_ADAPTER_MODE=live but no live Paystack adapter has been " +
        "implemented yet (packages/integrations/src/paystack/live.ts does " +
        "not exist). Set PAYSTACK_ADAPTER_MODE=stub until it does.",
    );
  }

  cached = createStubPaystackAdapter();
  return cached;
}

/**
 * Lets UI honestly show "online payment coming soon" instead of a dead
 * button, without invoking the adapter (which throws in stub mode).
 */
export function isPaystackLive(): boolean {
  return getServerEnv().PAYSTACK_ADAPTER_MODE === "live";
}
