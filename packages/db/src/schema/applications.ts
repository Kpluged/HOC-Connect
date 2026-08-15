import { sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgPolicy,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { app, canViewOrg, isHocStaff, timestamps } from "./_shared";
import {
  applicationDocumentKind,
  applicationDocumentStatus,
  applicationStatus,
} from "./enums";
import { organizations } from "./organizations";

/**
 * No `fleet_configurations` commerce schema in Milestone 5 (that's M6).
 * `configurationSnapshot` denormalizes the configurator's URL-carried
 * selections as a bridge until real persisted configurations exist. See
 * docs/HOC-Connect-architecture-and-schema.md section 4.
 */
export type ConfigurationSnapshot = {
  capturedAt: string;
  city?: string;
  fleetSize?: string;
  livery?: string;
  package?: string;
  vehicleSlugs: string[];
};

export const applications = app
  .table(
    "applications",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
      applicantUserId: uuid("applicant_user_id")
        .notNull()
        .references(() => authUsers.id),
      configurationSnapshot: jsonb(
        "configuration_snapshot",
      ).$type<ConfigurationSnapshot>(),
      companyName: text("company_name"),
      companyRegistrationNumber: text("company_registration_number"),
      contactPhone: text("contact_phone"),
      // Free text, not a hard enum - real Prembly vocabulary is unconfirmed.
      premblyReference: text("prembly_reference"),
      premblyStatus: text("prembly_status"),
      status: applicationStatus("status").notNull().default("draft"),
      decidedBy: uuid("decided_by").references(() => authUsers.id),
      decidedAt: timestamp("decided_at", { withTimezone: true }),
      submittedAt: timestamp("submitted_at", { withTimezone: true }),
      ...timestamps(),
    },
    (table) => [
      pgPolicy("applicants and tenant staff can select applications", {
        for: "select",
        to: authenticatedRole,
        using: sql`${table.applicantUserId} = ${authUid} or ${canViewOrg(table.organizationId)}`,
      }),
      pgPolicy("applicants can insert own applications", {
        for: "insert",
        to: authenticatedRole,
        // Must also belong to the target organization - applicantUserId
        // alone let anyone insert an application into any organization
        // (caught by Milestone 5's RLS smoke test).
        withCheck: sql`${table.applicantUserId} = ${authUid} and ${canViewOrg(table.organizationId)}`,
      }),
      pgPolicy("applicants can update own draft applications", {
        for: "update",
        to: authenticatedRole,
        // `using` (which rows are matchable) must allow the same states as
        // `withCheck` (resulting row) - a submit() that first flips
        // draft->submitted, then makes a second update to attach a Prembly
        // reference, needs to re-match the now-submitted row. Caught live
        // during Milestone 5's browser walkthrough: the second update
        // silently affected zero rows under RLS, no error thrown.
        using: sql`(${table.applicantUserId} = ${authUid} and ${table.status} in ('draft', 'submitted')) or ${isHocStaff}`,
        withCheck: sql`(${table.applicantUserId} = ${authUid} and ${table.status} in ('draft', 'submitted')) or ${isHocStaff}`,
      }),
    ],
  )
  .enableRLS();

export const applicationDocuments = app
  .table(
    "application_documents",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      applicationId: uuid("application_id")
        .notNull()
        .references(() => applications.id, { onDelete: "cascade" }),
      // Denormalized for cheap RLS - avoids a join on every document read.
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
      kind: applicationDocumentKind("kind").notNull(),
      status: applicationDocumentStatus("status").notNull().default("uploaded"),
      storagePath: text("storage_path").notNull(),
      uploadedBy: uuid("uploaded_by")
        .notNull()
        .references(() => authUsers.id),
      ...timestamps(),
    },
    (table) => [
      pgPolicy("uploader and tenant staff can select application documents", {
        for: "select",
        to: authenticatedRole,
        using: sql`${table.uploadedBy} = ${authUid} or ${canViewOrg(table.organizationId)}`,
      }),
      pgPolicy("uploader can insert application documents", {
        for: "insert",
        to: authenticatedRole,
        // Must also belong to the target organization - see the same fix
        // on applications' insert policy above.
        withCheck: sql`${table.uploadedBy} = ${authUid} and ${canViewOrg(table.organizationId)}`,
      }),
      pgPolicy("staff can update application document status", {
        for: "update",
        to: authenticatedRole,
        using: isHocStaff,
        withCheck: isHocStaff,
      }),
    ],
  )
  .enableRLS();

/**
 * Append-only - no update/delete policy exists at all, so no authenticated
 * role can ever modify or remove a note.
 */
export const applicationNotes = app
  .table(
    "application_notes",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      applicationId: uuid("application_id")
        .notNull()
        .references(() => applications.id, { onDelete: "cascade" }),
      organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id, { onDelete: "cascade" }),
      authorId: uuid("author_id")
        .notNull()
        .references(() => authUsers.id),
      body: text("body").notNull(),
      internal: boolean("internal").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      pgPolicy("staff see all notes, tenant sees non-internal notes", {
        for: "select",
        to: authenticatedRole,
        using: sql`${isHocStaff} or (not ${table.internal} and ${canViewOrg(table.organizationId)})`,
      }),
      pgPolicy("staff can insert notes", {
        for: "insert",
        to: authenticatedRole,
        withCheck: isHocStaff,
      }),
    ],
  )
  .enableRLS();
