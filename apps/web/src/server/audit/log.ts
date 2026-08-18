import "server-only";
import { auditLogs } from "@hoc/db";

import type { RLSTransaction } from "@/server/db/with-rls";

/**
 * Append-only (packages/db/src/schema/audit.ts has no update/delete
 * policy at all). Only ever called from resolvers already gated by
 * assertCanManageFleetOps or staffProcedure - the audit_logs INSERT
 * policy's own job is just preventing a caller from forging someone
 * else's actorUserId, not re-deriving the fleet-ops authorization check
 * a second time.
 */
export async function writeAuditLog(
  tx: RLSTransaction,
  {
    actorUserId,
    afterData,
    beforeData,
    action,
    entityId,
    entityType,
    organizationId,
  }: {
    actorUserId: string;
    afterData?: unknown;
    beforeData?: unknown;
    action: string;
    entityId: string;
    entityType: string;
    organizationId: string;
  },
) {
  await tx.insert(auditLogs).values({
    action,
    actorUserId,
    afterData,
    beforeData,
    entityId,
    entityType,
    organizationId,
  });
}
