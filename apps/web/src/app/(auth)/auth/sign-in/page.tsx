import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { safeRedirectTarget } from "@/lib/auth/redirect";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { requestSignInCode } from "../actions";
import { AuthSplitShell } from "../auth-split-shell";

export const metadata: Metadata = {
  description: "Sign in to continue your HOC Elite Wheels application.",
  title: "Sign in",
};

const errorCopy: Record<string, string> = {
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
      description="Enter your email and we'll send a one-time code. No password to remember."
      eyebrow="Account"
      title="Sign in to continue"
    >
      <form action={requestSignInCode} className="grid gap-8">
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <Field
          autoComplete="email"
          autoFocus
          description="We'll email a one-time code to this address."
          error={errorKey ? errorCopy[errorKey] : undefined}
          id="email"
          label="Email address"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
        <Button className="w-full" type="submit" variant="signal">
          Continue
        </Button>
      </form>
    </AuthSplitShell>
  );
}
