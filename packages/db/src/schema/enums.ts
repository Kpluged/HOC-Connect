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
