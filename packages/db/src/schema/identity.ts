import { sql } from "drizzle-orm";
import { pgPolicy, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, isHocStaff, timestamps } from "./_shared";
import { platformRole, platformRoleStatus } from "./enums";

/**
 * Row is created only by the `private.handle_new_user()` trigger on
 * `auth.users` insert (profile_bootstrap_trigger migration) - never by
 * application code.
 */
export const profiles = app
  .table(
    "profiles",
    {
      id: uuid("id")
        .primaryKey()
        .references(() => authUsers.id, { onDelete: "cascade" }),
      fullName: text("full_name"),
      onboardingState: text("onboarding_state").notNull().default("started"),
      phone: text("phone"),
      ...timestamps(),
    },
    (table) => [
      pgPolicy("individuals can select own profile", {
        for: "select",
        to: authenticatedRole,
        using: sql`${table.id} = ${authUid} or ${isHocStaff}`,
      }),
      pgPolicy("individuals can update own profile", {
        for: "update",
        to: authenticatedRole,
        using: sql`${table.id} = ${authUid}`,
        withCheck: sql`${table.id} = ${authUid}`,
      }),
    ],
  )
  .enableRLS();

/**
 * No self-service invite flow exists yet - the first row is granted via a
 * one-off manual statement documented in docs/staff-bootstrap.md.
 */
export const platformRoles = app
  .table(
    "platform_roles",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      role: platformRole("role").notNull(),
      status: platformRoleStatus("status").notNull().default("active"),
      userId: uuid("user_id")
        .notNull()
        .references(() => authUsers.id, { onDelete: "cascade" }),
      ...timestamps(),
    },
    (table) => [
      uniqueIndex("platform_roles_active_user_idx")
        .on(table.userId)
        .where(sql`${table.status} = 'active'`),
      pgPolicy("individuals can select own platform role", {
        for: "select",
        to: authenticatedRole,
        using: sql`${table.userId} = ${authUid} or ${isHocStaff}`,
      }),
    ],
  )
  .enableRLS();
