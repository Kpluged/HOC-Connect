import { app } from "./_shared";

export const platformRole = app.enum("platform_role", ["hoc_staff", "hoc_admin"]);
export const platformRoleStatus = app.enum("platform_role_status", [
  "active",
  "revoked",
]);

export const organizationRole = app.enum("organization_role", [
  "owner",
  "dispatcher",
  "driver",
]);
export const membershipStatus = app.enum("membership_status", [
  "invited",
  "active",
  "disabled",
]);
export const organizationStatus = app.enum("organization_status", [
  "draft",
  "applied",
  "approved",
  "live",
  "suspended",
]);

export const applicationStatus = app.enum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "declined",
]);
export const applicationDocumentKind = app.enum("application_document_kind", [
  "government_id",
  "proof_of_address",
  "company_registration",
  "tax_document",
  "other",
]);
export const applicationDocumentStatus = app.enum(
  "application_document_status",
  ["uploaded", "verified", "rejected"],
);

export const vehicleLifecycleStatus = app.enum("vehicle_lifecycle_status", [
  "allocated",
  "delivered",
  "active",
]);

export const orderStatus = app.enum("order_status", [
  "draft",
  "deposit_pending",
  "deposit_paid",
  "balance_pending",
  "paid_in_full",
  "cancelled",
]);
export const paymentKind = app.enum("payment_kind", ["deposit", "balance"]);
export const paymentStatus = app.enum("payment_status", [
  "pending",
  "succeeded",
  "failed",
]);

// --- Milestone 9: dispatch / operations ---

/**
 * The real ride lifecycle (docs/HOC-Connect-architecture-and-schema.md §4).
 * Legal transitions are enforced by app.transition_trip(); this enum only
 * declares the vocabulary.
 */
export const tripStatus = app.enum("trip_status", [
  "requested",
  "offered",
  "assigned",
  "driver_en_route",
  "driver_arrived",
  "in_progress",
  "completed",
  "cancelled",
]);
export const tripSource = app.enum("trip_source", [
  "manual",
  "corporate",
  "api",
  "rider_future",
]);

/**
 * A driver's live dispatch availability, distinct from the vetting/enrolment
 * `membership_status` reused by drivers.status - a driver can be an `active`
 * member yet `offline` for dispatch. Defaults to offline until the driver app
 * (M9b) reports availability.
 */
export const driverOperationalStatus = app.enum("driver_operational_status", [
  "offline",
  "available",
  "on_trip",
]);

export const vehicleHealthState = app.enum("vehicle_health_state", [
  "nominal",
  "attention",
  "critical",
]);

export const chargingStatus = app.enum("charging_status", [
  "in_progress",
  "completed",
]);

export const maintenanceSeverity = app.enum("maintenance_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const maintenanceStatus = app.enum("maintenance_status", [
  "open",
  "in_progress",
  "resolved",
]);
