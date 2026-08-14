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
