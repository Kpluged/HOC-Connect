"use server";

import { membershipStatusSchema } from "@hoc/contracts";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerCaller } from "@/server/trpc/caller";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Matches the driver-photos bucket limit and sits under the Server Action
// bodySizeLimit (next.config.ts) so a valid image never trips the 1MB default.
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function isValidImage(file: FormDataEntryValue | null): file is File {
  return (
    file instanceof File &&
    file.size > 0 &&
    file.size <= MAX_PHOTO_BYTES &&
    ALLOWED_IMAGE_TYPES.includes(file.type)
  );
}

/**
 * Uploads a driver photo to the private bucket at `<org>/<driver>` (stable path,
 * upsert - no orphaned objects on re-upload) and records the path. Storage RLS
 * still authorizes the write against the caller's org role.
 */
async function uploadDriverPhoto(
  organizationId: string,
  driverId: string,
  file: File,
) {
  const supabase = await createSupabaseServerClient();
  const path = `${organizationId}/${driverId}`;
  const { error } = await supabase.storage
    .from("driver-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  // Never record a photo the storage layer didn't actually accept.
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const caller = await getServerCaller();
  await caller.drivers.setPhotoPath({ driverId, photoPath: path });
}

export async function createDriver(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const displayName = z.string().trim().min(1).parse(formData.get("displayName"));
  const phone = formData.get("phone")?.toString().trim() || undefined;
  const licenceReference =
    formData.get("licenceReference")?.toString().trim() || undefined;

  const caller = await getServerCaller();
  const driver = await caller.drivers.create({
    displayName,
    licenceReference,
    organizationId,
    phone,
  });

  const photo = formData.get("photo");
  if (isValidImage(photo)) {
    // Best-effort: the driver is already created, so a photo hiccup must not
    // abort the flow and tempt a duplicate re-submit. The dedicated
    // setDriverPhoto action (below) surfaces upload failures instead.
    try {
      await uploadDriverPhoto(organizationId, driver.id, photo);
    } catch {
      // Photo can be added later from the driver's detail page.
    }
  }

  redirect("/space/drivers");
}

export async function setDriverPhoto(formData: FormData) {
  const driverId = z.uuid().parse(formData.get("driverId"));
  const photo = formData.get("photo");

  const caller = await getServerCaller();
  const driver = await caller.drivers.getById({ id: driverId });
  if (!driver) redirect("/space/drivers");

  if (isValidImage(photo)) {
    await uploadDriverPhoto(driver.organizationId, driverId, photo);
  }

  redirect(`/space/drivers/${driverId}`);
}

export async function removeDriverPhoto(formData: FormData) {
  const driverId = z.uuid().parse(formData.get("driverId"));

  const caller = await getServerCaller();
  const driver = await caller.drivers.getById({ id: driverId });
  if (driver?.photoPath) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage
      .from("driver-photos")
      .remove([driver.photoPath]);
    // Keep the DB pointing at the photo until the object is actually gone,
    // so we never leave an orphaned object with no record of it.
    if (error) throw new Error(`Photo removal failed: ${error.message}`);
    await caller.drivers.setPhotoPath({ driverId, photoPath: null });
  }

  redirect(`/space/drivers/${driverId}`);
}

export async function updateDriverStatus(formData: FormData) {
  const driverId = z.uuid().parse(formData.get("driverId"));
  const status = membershipStatusSchema.parse(formData.get("status"));

  const caller = await getServerCaller();
  await caller.drivers.updateStatus({ driverId, status });

  redirect(`/space/drivers/${driverId}`);
}

export async function assignVehicle(formData: FormData) {
  const organizationId = z.uuid().parse(formData.get("organizationId"));
  const driverId = z.uuid().parse(formData.get("driverId"));
  const vehicleId = z.uuid().parse(formData.get("vehicleId"));

  const caller = await getServerCaller();
  await caller.shifts.assign({ driverId, organizationId, vehicleId });

  redirect(`/space/drivers/${driverId}`);
}

export async function endShift(formData: FormData) {
  const driverId = z.uuid().parse(formData.get("driverId"));
  const shiftId = z.uuid().parse(formData.get("shiftId"));

  const caller = await getServerCaller();
  await caller.shifts.end({ shiftId });

  redirect(`/space/drivers/${driverId}`);
}
