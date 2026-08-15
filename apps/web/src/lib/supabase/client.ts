"use client";

import { getClientEnv } from "@hoc/config/client";
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getClientEnv();
  return createBrowserClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
