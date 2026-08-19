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

export const vehicleLifecycleStatusSchema = z.enum([
  "allocated",
  "delivered",
  "active",
]);

export type VehicleLifecycleStatus = z.infer<typeof vehicleLifecycleStatusSchema>;

/**
 * VINs are staff-entered exactly once at allocation time (no reserve-then-
 * attach flow) - normalized to uppercase/trimmed here (single source of
 * truth) so the DB's plain unique index can't be bypassed by case
 * variation alone.
 */
export const vinSchema = z
  .string()
  .trim()
  .min(5, "VIN looks too short")
  .max(32, "VIN looks too long")
  .transform((value) => value.toUpperCase());

export const allocateVehicleSchema = z.object({
  orderId: z.uuid(),
  plate: z.string().trim().min(1).optional(),
  vehicleModelSlug: z.string().min(1),
  vin: vinSchema,
});

export const membershipStatusSchema = z.enum(["invited", "active", "disabled"]);
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export const createDriverSchema = z.object({
  displayName: z.string().trim().min(1),
  licenceReference: z.string().trim().min(1).optional(),
  organizationId: z.uuid(),
  phone: z.string().trim().min(1).optional(),
});

export const updateDriverStatusSchema = z.object({
  driverId: z.uuid(),
  status: membershipStatusSchema,
});

export const setDriverPhotoPathSchema = z.object({
  driverId: z.uuid(),
  // Storage path in the driver-photos bucket, or null to clear the photo.
  photoPath: z.string().trim().min(1).nullable(),
});

export const assignVehicleSchema = z.object({
  driverId: z.uuid(),
  organizationId: z.uuid(),
  vehicleId: z.uuid(),
});

export const endShiftSchema = z.object({
  shiftId: z.uuid(),
});

// --- Milestone 9: dispatch / operations ---

export const tripSourceSchema = z.enum([
  "manual",
  "corporate",
  "api",
  "rider_future",
]);
export const tripStatusSchema = z.enum([
  "requested",
  "offered",
  "assigned",
  "driver_en_route",
  "driver_arrived",
  "in_progress",
  "completed",
  "cancelled",
]);
export type TripStatus = z.infer<typeof tripStatusSchema>;

/** {lat,lng} in WGS84 degrees, bounded to valid Earth coordinates. */
export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof geoPointSchema>;

export const createTripSchema = z.object({
  organizationId: z.uuid(),
  pickupLabel: z.string().trim().min(1),
  pickup: geoPointSchema,
  dropoffLabel: z.string().trim().min(1),
  dropoff: geoPointSchema,
  source: tripSourceSchema.optional(),
});

export const assignTripSchema = z.object({
  tripId: z.uuid(),
  driverId: z.uuid(),
  vehicleId: z.uuid(),
});

/**
 * The manager-advanceable target states. `requested`/`offered`/`assigned` are
 * only ever set by create/assign, never by a bare transition; the DB function
 * enforces the full legal graph regardless.
 */
export const tripTransitionTargetSchema = z.enum([
  "driver_en_route",
  "driver_arrived",
  "in_progress",
  "completed",
  "cancelled",
]);
export const transitionTripSchema = z.object({
  tripId: z.uuid(),
  next: tripTransitionTargetSchema,
});

export const driverOperationalStatusSchema = z.enum([
  "offline",
  "available",
  "on_trip",
]);
/** Managers toggle offline/available; on_trip is set by the assign flow only. */
export const setDriverOperationalStatusSchema = z.object({
  driverId: z.uuid(),
  operationalStatus: z.enum(["offline", "available"]),
});

/** A driver reporting their own position from the driver app (Milestone 9b). */
export const reportLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  operationalStatus: z.enum(["offline", "available"]).optional(),
});

/** tripId-only input shared by the offer accept/decline mutations. */
export const tripActionSchema = z.object({ tripId: z.uuid() });

export const maintenanceSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export const maintenanceStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
]);

export const openMaintenanceTicketSchema = z.object({
  organizationId: z.uuid(),
  vehicleId: z.uuid(),
  category: z.string().trim().min(1),
  severity: maintenanceSeveritySchema,
  title: z.string().trim().min(1),
  notes: z.string().trim().min(1).optional(),
});
export const updateMaintenanceTicketSchema = z.object({
  ticketId: z.uuid(),
  status: maintenanceStatusSchema,
  notes: z.string().trim().min(1).optional(),
});

export const logChargingSessionSchema = z
  .object({
    organizationId: z.uuid(),
    vehicleId: z.uuid(),
    driverId: z.uuid().optional(),
    locationLabel: z.string().trim().min(1).optional(),
    energyWh: z.number().int().nonnegative().optional(),
    costMinor: z.number().int().nonnegative().optional(),
    currency: z.string().regex(/^[A-Z]{3}$/, "expected a 3-letter ISO-4217 code").optional(),
  })
  // Money never travels without its currency (mirrors the DB check constraint).
  .refine((v) => v.costMinor === undefined || v.currency !== undefined, {
    message: "currency is required when a cost is provided",
    path: ["currency"],
  });
