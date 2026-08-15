import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { safeRedirectTarget } from "@/lib/auth/redirect";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { requestSignInCode, signInWithPassword } from "../actions";
import { AuthSplitShell } from "../auth-split-shell";

export const metadata: Metadata = {
  description: "Sign in to continue your HOC Elite Wheels application.",
  title: "Sign in",
};

const errorCopy: Record<string, string> = {
  invalid_credentials: "That email and password combination didn't work.",
  invalid_email: "Enter a valid email address.",
  send_failed:
    "We couldn't send a code to that address. Try again in a moment.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const redirectTo = safeRedirectTarget(firstParam(query, "redirectTo"));
  const errorKey = firstParam(query, "error");

  return (
    <AuthSplitShell
      description="Sign in with your email and password, or we can email you a one-time code instead."
      eyebrow="Account"
      title="Sign in to continue"
    >
      <form action={signInWithPassword} className="grid gap-6">
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <Field
          autoComplete="email"
          autoFocus
          error={errorKey === "invalid_credentials" ? errorCopy[errorKey] : undefined}
          id="password-email"
          label="Email address"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
        <Field
          autoComplete="current-password"
          id="password"
          label="Password"
          name="password"
          required
          type="password"
        />
        <Button className="w-full" type="submit" variant="signal">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-contrast-medium">
        New to HOC Elite Wheels?{" "}
        <Link
          className="font-semibold text-primary underline-offset-4 hover:underline"
          href={`/auth/register?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          Create an account
        </Link>
      </p>

      <div className="mt-10 border-t border-contrast-low pt-8">
        <p className="text-sm font-semibold">Prefer a one-time code?</p>
        <form action={requestSignInCode} className="mt-4 grid gap-4">
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <Field
            description="We'll email a one-time code to this address - no password needed."
            error={
              errorKey && errorKey !== "invalid_credentials"
                ? errorCopy[errorKey]
                : undefined
            }
            id="otp-email"
            label="Email address"
            name="email"
            placeholder="you@company.com"
            required
            type="email"
          />
          <Button className="w-full" type="submit" variant="outline">
            Email me a code
          </Button>
        </form>
      </div>
    </AuthSplitShell>
  );
}
