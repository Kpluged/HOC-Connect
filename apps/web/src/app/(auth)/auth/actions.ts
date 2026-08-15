"use server";

import { emailSchema } from "@hoc/contracts";
import { redirect } from "next/navigation";

import { safeRedirectTarget } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestSignInCode(formData: FormData) {
  const redirectTo = safeRedirectTarget(
    formData.get("redirectTo")?.toString(),
  );
  const parsedEmail = emailSchema.safeParse(formData.get("email"));

  if (!parsedEmail.success) {
    redirect(
      `/auth/sign-in?error=invalid_email&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsedEmail.data,
    options: { shouldCreateUser: true },
  });

  if (error) {
    redirect(
      `/auth/sign-in?error=send_failed&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  redirect(
    `/auth/verify?email=${encodeURIComponent(parsedEmail.data)}&redirectTo=${encodeURIComponent(redirectTo)}`,
  );
}

export type VerifyState = { error?: string } | undefined;

export async function verifySignInCode(
  _prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = formData.get("email")?.toString() ?? "";
  const token = formData.get("token")?.toString().trim() ?? "";
  const redirectTo = safeRedirectTarget(
    formData.get("redirectTo")?.toString(),
  );

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success || !/^\d{6,10}$/.test(token)) {
    return { error: "Enter the code sent to your email." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsedEmail.data,
    token,
    type: "email",
  });

  if (error) {
    return {
      error: "That code didn't work. Check your email and try again.",
    };
  }

  redirect(redirectTo);
}
