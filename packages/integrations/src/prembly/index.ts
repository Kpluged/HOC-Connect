import "server-only";
import { getServerEnv } from "@hoc/config/server";

import { createStubPremblyAdapter } from "./stub";
import type { PremblyAdapter } from "./types";

export type {
  KycDocumentInput,
  KycSubjectInput,
  KycVerificationResult,
  KycVerificationStatus,
  PremblyAdapter,
} from "./types";

let cached: PremblyAdapter | undefined;

/**
 * Swap point: once real Prembly credentials + API docs exist, add
 * `./live.ts` implementing PremblyAdapter and set PREMBLY_ADAPTER_MODE=live.
 * Call sites never change.
 */
export function getPremblyAdapter(): PremblyAdapter {
  if (cached) return cached;

  const { PREMBLY_ADAPTER_MODE } = getServerEnv();

  if (PREMBLY_ADAPTER_MODE === "live") {
    throw new Error(
      "PREMBLY_ADAPTER_MODE=live but no live Prembly adapter has been " +
        "implemented yet (packages/integrations/src/prembly/live.ts does " +
        "not exist). Set PREMBLY_ADAPTER_MODE=stub until it does.",
    );
  }

  cached = createStubPremblyAdapter();
  return cached;
}
