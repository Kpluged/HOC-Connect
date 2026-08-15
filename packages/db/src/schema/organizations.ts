import { sql } from "drizzle-orm";
import { pgPolicy, primaryKey, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, canManageOrg, canViewOrg, timestamps } from "./_shared";
import { membershipStatus, organizationRole, organizationStatus } from "./enums";

/**
 * No `cities`/PostGIS table in Milestone 5 - `cityLabel` is free text,
 * matching how the `/configure` city step already works ("proposed market,
 * not current availability"). See docs/HOC-Connect-architecture-and-schema.md
 * section 4 for the fuller model this is trimmed from.
 */
export const organizations = app
  .table(
    "organizations",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      name: text("name").notNull(),
      slug: text("slug").notNull(),
      cityLabel: text("city_label").notNull(),
      status: organizationStatus("status").notNull().default("draft"),
      currency: text("currency"),
      timezone: text("timezone"),
      createdBy: uuid("created_by")
        .notNull()
        .references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      uniqueIndex("organizations_slug_idx").on(table.slug),
      pgPolicy("creator and tenant can select organizations", {
        for: "select",
        to: authenticatedRole,
        using: sql`${table.createdBy} = ${authUid} or ${canViewOrg(table.id)}`,
      }),
      pgPolicy("individuals can insert own organizations", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`${table.createdBy} = ${authUid}`,
      }),
      pgPolicy("owners and staff can update organizations", {
        for: "update",
        to: authenticatedRole,
        using: canManageOrg(table.id),
        withCheck: canManageOrg(table.id),
      }),
    ],
  )
  .enableRLS();

export const organizationMemberships = app
  .table(
    "organization_memberships",
    {
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
      role: organizationRole("role").notNull(),
      status: membershipStatus("status").notNull().default("invited"),
      userId: uuid("user_id")
        .notNull()
        .references(() => authUsers.id, { onDelete: "cascade" }),
      ...timestamps(),
    },
    (table) => [
      primaryKey({ columns: [table.organizationId, table.userId] }),
      pgPolicy("members can select own membership rows", {
        for: "select",
        to: authenticatedRole,
        using: sql`${table.userId} = ${authUid} or ${canViewOrg(table.organizationId)}`,
      }),
      // Bootstrap: an org's creator can insert their own owner row even
      // though no membership (and therefore no has_org_role match) exists
      // yet - without this, self-service onboarding can never create the
      // first membership. Permissive policies OR together, so this only
      // ever widens access for this one self-insert case.
      pgPolicy("creator can insert own owner membership", {
        for: "insert",
        to: authenticatedRole,
        withCheck: sql`
          ${table.userId} = ${authUid}
          and ${table.role} = 'owner'
          and exists (
            select 1 from ${organizations} o
            where o.id = ${table.organizationId} and o.created_by = ${authUid}
          )
        `,
      }),
      pgPolicy("owners and staff manage memberships", {
        for: "all",
        to: authenticatedRole,
        using: canManageOrg(table.organizationId),
        withCheck: canManageOrg(table.organizationId),
      }),
    ],
  )
  .enableRLS();
