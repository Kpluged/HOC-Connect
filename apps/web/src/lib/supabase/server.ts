import "server-only";
import { getServerEnv } from "@hoc/config/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * A fresh client per request, per @supabase/ssr's own guidance - never
 * shared or cached across requests.
 */
export async function createSupabaseServerClient() {
  const { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getServerEnv();
  const cookieStore = await cookies();

  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Called from a Server Component with no response to write to
          // (e.g. a page render triggered by prefetch) throws; proxy.ts's
          // updateSession is what actually persists the refreshed session
          // in that case, so this is safe to swallow.
          try {
            for (const { name, options, value } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Ignored - see comment above.
          }
        },
      },
    },
  );
}
