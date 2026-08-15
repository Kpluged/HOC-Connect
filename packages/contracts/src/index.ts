import { z } from "zod";

export const userRoleSchema = z.enum([
  "owner",
  "dispatcher",
  "driver",
  "hoc_staff",
  "hoc_admin",
]);

export const organizationIdSchema = z.uuid();
export const tripIdSchema = z.uuid();

export type UserRole = z.infer<typeof userRoleSchema>;
export type OrganizationId = z.infer<typeof organizationIdSchema>;
export type TripId = z.infer<typeof tripIdSchema>;

export const platformRoleSchema = z.enum(["hoc_staff", "hoc_admin"]);
export const organizationRoleSchema = z.enum(["owner", "dispatcher", "driver"]);

export type PlatformRole = z.infer<typeof platformRoleSchema>;
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

export const organizationStatusSchema = z.enum([
  "draft",
  "applied",
  "approved",
  "live",
  "suspended",
]);

export const applicationStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "approved",
  "declined",
]);

export const applicationDocumentKindSchema = z.enum([
  "government_id",
  "proof_of_address",
  "company_registration",
  "tax_document",
  "other",
]);

export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationDocumentKind = z.infer<
  typeof applicationDocumentKindSchema
>;

/**
 * Denormalized bridge until Milestone 6's persisted fleet_configurations
 * schema exists - captures /configure's URL-carried selections at the
 * moment an application is opened. See
 * docs/HOC-Connect-architecture-and-schema.md section 4.
 */
export const configurationSnapshotSchema = z.object({
  capturedAt: z.iso.datetime(),
  city: z.string().optional(),
  fleetSize: z.string().optional(),
  livery: z.string().optional(),
  package: z.string().optional(),
  vehicleSlugs: z.array(z.string()),
});

export type ConfigurationSnapshot = z.infer<typeof configurationSnapshotSchema>;

export const emailSchema = z.email();

export const identityStepSchema = z.object({
  documentType: z.enum(["national_id", "passport", "drivers_licence"]),
  fullName: z.string().min(1),
  phone: z.string().min(1),
});

export const companyStepSchema = z.object({
  companyName: z.string().min(1),
  companyRegistrationNumber: z.string().min(1),
});

export const applicationDocumentUploadSchema = z.object({
  applicationId: z.uuid(),
  kind: applicationDocumentKindSchema,
  storagePath: z.string().min(1),
});

export const applicationDecisionSchema = z.object({
  applicationId: z.uuid(),
  decision: z.enum(["approved", "declined"]),
});

export const orderStatusSchema = z.enum([
  "draft",
  "deposit_pending",
  "deposit_paid",
  "balance_pending",
  "paid_in_full",
  "cancelled",
]);

export const paymentKindSchema = z.enum(["deposit", "balance"]);

export const paymentStatusSchema = z.enum(["pending", "succeeded", "failed"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentKind = z.infer<typeof paymentKindSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/**
 * Money is always non-negative integer minor units plus an explicit 3-letter
 * currency code - no floats. See docs/HOC-Connect-architecture-and-schema.md
 * section 9.
 */
export const currencySchema = z.string().length(3);

export const createOrderSchema = z.object({
  applicationId: z.uuid(),
  currency: currencySchema,
  depositMinor: z.number().int().nonnegative(),
  pricingNote: z.string().optional(),
  totalMinor: z.number().int().nonnegative(),
});
