import "server-only";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

import type { RLSTransaction } from "@/server/db/with-rls";

/**
 * Postgres-backed fixed-window rate limiter
 * (private.check_rate_limit, migration 0018_rate_limits.sql) - not a new
 * Redis vendor, since Postgres is already the shared, consistent
 * datastore every request already talks to. Throws a clean
 * TOO_MANY_REQUESTS rather than letting an unbounded write loop hit the
 * database.
 */
export async function assertWithinRateLimit(
  tx: RLSTransaction,
  {
    key,
    maxAttempts,
    windowSeconds,
  }: { key: string; maxAttempts: number; windowSeconds: number },
) {
  const [row] = await tx.execute<{ allowed: boolean }>(
    sql`select private.check_rate_limit(${key}, ${maxAttempts}, ${windowSeconds}) as allowed`,
  );

  if (!row?.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Try again shortly.",
    });
  }
}
