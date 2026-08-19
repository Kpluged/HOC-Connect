import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Two callers: Server Actions/Components (cookie session) and HTTP clients like
 * the driver app, which send `Authorization: Bearer <access-token>`. When a
 * bearer token is present it's verified with getClaims(token); otherwise the
 * cookie session is used. Either way `claims` has the same shape, so
 * protectedProcedure/withRLS are unchanged.
 */
export async function createContext(opts?: { headers?: Headers }) {
  const supabase = await createSupabaseServerClient();

  const authHeader = opts?.headers?.get("authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const { data, error } = bearer
    ? await supabase.auth.getClaims(bearer)
    : await supabase.auth.getClaims();
  const claims = error ? null : (data?.claims ?? null);

  return { claims, supabase };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
