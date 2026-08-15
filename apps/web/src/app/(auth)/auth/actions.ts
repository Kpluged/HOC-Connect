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

export async function signInWithPassword(formData: FormData) {
  const redirectTo = safeRedirectTarget(
    formData.get("redirectTo")?.toString(),
  );
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const password = formData.get("password")?.toString() ?? "";

  if (!parsedEmail.success || password.length === 0) {
    redirect(
      `/auth/sign-in?error=invalid_credentials&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsedEmail.data,
    password,
  });

  if (error) {
    redirect(
      `/auth/sign-in?error=invalid_credentials&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  redirect(redirectTo);
}

export async function registerWithPassword(formData: FormData) {
  const redirectTo = safeRedirectTarget(
    formData.get("redirectTo")?.toString(),
  );
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (!parsedEmail.success) {
    redirect(
      `/auth/register?error=invalid_email&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  if (password.length < 6) {
    redirect(
      `/auth/register?error=password_too_short&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/auth/register?error=password_mismatch&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsedEmail.data,
    password,
  });

  if (error) {
    redirect(
      `/auth/register?error=registration_failed&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  // If email confirmation is required (Supabase project default), signUp
  // returns a user but no session yet - the account can't sign in until
  // that confirmation link is clicked. Send them to a clear "check your
  // email" state rather than pretending they're signed in.
  if (!data.session) {
    redirect(
      `/auth/register/check-email?email=${encodeURIComponent(parsedEmail.data)}`,
    );
  }

  redirect(redirectTo);
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
