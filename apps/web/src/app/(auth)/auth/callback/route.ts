import { NextResponse } from "next/server";

import { safeRedirectTarget } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Forward-compat for a code-exchange (magic-link-style) flow. Not the
 * primary path for Milestone 5's OTP code-entry sign-in.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = safeRedirectTarget(url.searchParams.get("redirectTo"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
