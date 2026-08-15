import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { safeRedirectTarget } from "@/lib/auth/redirect";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { registerWithPassword } from "../actions";
import { AuthSplitShell } from "../auth-split-shell";

export const metadata: Metadata = {
  description: "Create a HOC Elite Wheels account.",
  title: "Create an account",
};

const errorCopy: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  password_mismatch: "Passwords don't match.",
  password_too_short: "Password must be at least 6 characters.",
  registration_failed: "We couldn't create that account. Try again in a moment.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const redirectTo = safeRedirectTarget(firstParam(query, "redirectTo"));
  const errorKey = firstParam(query, "error");

  return (
    <AuthSplitShell
      description="Set an email and password. You can start an application as soon as your account is ready."
      eyebrow="Account"
      title="Create an account"
    >
      <form action={registerWithPassword} className="grid gap-6">
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <Field
          autoComplete="email"
          autoFocus
          error={errorKey === "invalid_email" ? errorCopy[errorKey] : undefined}
          id="email"
          label="Email address"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
        <Field
          autoComplete="new-password"
          description="At least 6 characters."
          error={errorKey === "password_too_short" ? errorCopy[errorKey] : undefined}
          id="password"
          label="Password"
          minLength={6}
          name="password"
          required
          type="password"
        />
        <Field
          autoComplete="new-password"
          error={errorKey === "password_mismatch" ? errorCopy[errorKey] : undefined}
          id="confirmPassword"
          label="Confirm password"
          minLength={6}
          name="confirmPassword"
          required
          type="password"
        />
        {errorKey === "registration_failed" ? (
          <p className="text-sm font-semibold text-primary">
            {errorCopy[errorKey]}
          </p>
        ) : null}
        <Button className="w-full" type="submit" variant="signal">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-contrast-medium">
        Already have an account?{" "}
        <Link
          className="font-semibold text-primary underline-offset-4 hover:underline"
          href={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          Sign in
        </Link>
      </p>
    </AuthSplitShell>
  );
}
