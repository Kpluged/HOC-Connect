import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Batch-signs read URLs for a set of driver photo storage paths. Returns a
 * `path -> signedUrl` map; unknown/absent paths are simply missing from it.
 * The signing uses the caller's RLS-scoped client, so the driver-photos SELECT
 * policy (managers/staff of the photo's org) still applies.
 */
export async function signDriverPhotoUrls(
  paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("driver-photos")
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}
