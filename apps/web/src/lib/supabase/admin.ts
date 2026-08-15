import "server-only";
import { getServerEnv, requireServiceRoleKey } from "@hoc/config/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client - bypasses RLS entirely. Not used by any user-facing
 * procedure; reserved for verified provider webhooks and the documented
 * staff-bootstrap path (docs/staff-bootstrap.md). Never import this from
 * client code or from a procedure reachable by an authenticated user's own
 * request.
 */
export function createSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getServerEnv();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
