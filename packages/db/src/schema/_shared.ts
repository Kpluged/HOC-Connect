import { sql, type SQL } from "drizzle-orm";
import { bigint, customType, pgSchema, timestamp } from "drizzle-orm/pg-core";

/**
 * Business tables live in `app`, a non-Data-API-exposed Postgres schema.
 * See docs/HOC-Connect-architecture-and-schema.md section 1.
 */
export const app = pgSchema("app");

/**
 * PostGIS geography(Point,4326) columns (Milestone 9). PostGIS is installed
 * into the dedicated `gis` schema by the 0019 migration - never pinned, never
 * in `public`. See docs/HOC-Connect-architecture-and-schema.md sections 5-6.
 *
 * The `data` contract is intentionally `string`: a raw read of a geography
 * column returns PostGIS EWKB hex, not a decoded point, and this codebase never
 * reads it raw across the transport boundary - every dispatch/telemetry query
 * projects `gis.ST_X`/`gis.ST_Y` to `{lat,lng}` explicitly. Writes likewise go
 * through raw SQL / the trip lifecycle functions
 * (`ST_SetSRID(ST_MakePoint(lng,lat),4326)::gis.geography`), never the Drizzle
 * query builder, so no encoder/decoder is declared here. Typing `data` as the
 * EWKB string keeps the contract honest rather than promising a `{lat,lng}`
 * shape reads don't actually return.
 */
export const geographyPoint = customType<{ data: string }>({
  dataType: () => "gis.geography(Point,4326)",
});

/** Money is always non-negative integer minor units (kobo), never a float. */
export const moneyMinor = (name: string) => bigint(name, { mode: "number" });

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
