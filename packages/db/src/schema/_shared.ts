import { sql, type SQL } from "drizzle-orm";
import { pgSchema, timestamp } from "drizzle-orm/pg-core";

/**
 * Business tables live in `app`, a non-Data-API-exposed Postgres schema.
 * See docs/HOC-Connect-architecture-and-schema.md section 1.
 */
export const app = pgSchema("app");

export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * RLS policy helpers wrapping the `private.*` functions installed by the
 * private_rls_helpers migration (docs/HOC-Connect-architecture-and-schema.md
 * section 7). Kept as raw SQL fragments since Drizzle cannot express
 * `CREATE FUNCTION` bodies.
 */
export const isHocStaff: SQL = sql`(select private.is_hoc_staff())`;

export const canViewOrg = (organizationId: SQL | unknown): SQL =>
  sql`(select private.can_view_org(${organizationId}))`;

export const canManageOrg = (organizationId: SQL | unknown): SQL =>
  sql`${isHocStaff} or (select private.has_org_role(${organizationId}, array['owner']::text[]))`;

/**
 * Broader than canManageOrg (owner-only, reserved for org settings/
 * membership management) - fleet operations (drivers, shifts, vehicle
 * assignment) are legitimately a dispatcher's job too. First helper in
 * the codebase to actually exercise the 'dispatcher' role.
 *
 * Wrapped in its own outer parens (unlike canManageOrg) because this one
 * is used compounded with `and` at some call sites (e.g. shifts' insert
 * policy) - `A or B and C` parses as `A or (B and C)` in SQL, which would
 * let staff bypass the eligibility EXISTS checks entirely via the OR
 * short-circuit. Caught by inspecting generated SQL before applying it.
 */
export const canManageFleetOps = (organizationId: SQL | unknown): SQL =>
  sql`(${isHocStaff} or (select private.has_org_role(${organizationId}, array['owner','dispatcher']::text[])))`;
