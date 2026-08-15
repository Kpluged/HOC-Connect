import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createContext() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : (data?.claims ?? null);

  return { claims, supabase };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
