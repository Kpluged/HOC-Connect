import { sql } from "drizzle-orm";
import {
  bigint,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, isHocStaff } from "./_shared";
import { organizations } from "./organizations";

/**
 * Milestone 8 - brought forward from its original later slot because
 * driver/shift writes are the first genuinely audit-worthy flows in the
 * codebase. Append-only: no update/delete policy exists at all, matching
 * applicationNotes' own precedent. writeAuditLog()
 * (apps/web/src/server/audit/log.ts) is the only intended caller, and is
 * itself only ever invoked from resolvers already gated by
 * assertCanManageFleetOps - the INSERT policy's own job is just
 * preventing a caller from forging someone else's actorUserId, not
 * re-deriving the fleet-ops authorization check a second time.
 */
export const auditLogs = app
  .table(
    "audit_logs",
    {
      id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),
      actorUserId: uuid("actor_user_id")
        .notNull()
        .references(() => authUsers.id),
      action: text("action").notNull(),
      entityType: text("entity_type").notNull(),
      entityId: uuid("entity_id").notNull(),
      beforeData: jsonb("before_data"),
      afterData: jsonb("after_data"),
      requestId: text("request_id"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      pgPolicy("staff can select audit logs", {
        for: "select",
        to: authenticatedRole,
        using: isHocStaff,
      }),
      pgPolicy("actor can insert their own audit log entries", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`${table.actorUserId} = ${authUid}`,
      }),
    ],
  )
  .enableRLS();
