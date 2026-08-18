import "server-only";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

import type { RLSTransaction } from "@/server/db/with-rls";

/**
 * First owner/dispatcher-gated (not staff-only, not RLS-only) check in
 * the codebase - every prior owner-scoped write relied purely on RLS,
 * with the router only checking "0 rows returned -> NOT_FOUND". Called
 * explicitly at the top of a resolver (input isn't parsed yet when
 * middleware would need to run, so this is a plain function, not a
 * chained procedure like staffProcedure) so an unauthorized caller gets
 * a clean 403 instead of a raw Postgres 42501 surfaced as a 500.
 */
export async function assertCanManageFleetOps(
  tx: RLSTransaction,
  { organizationId }: { organizationId: string },
) {
  const [row] = await tx.execute<{ allowed: boolean }>(
    sql`select (
      (select private.has_org_role(${organizationId}, array['owner','dispatcher']::text[]))
      or (select private.is_hoc_staff())
    ) as allowed`,
  );

  if (!row?.allowed) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}
