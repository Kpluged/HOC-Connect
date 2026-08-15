import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SiteHeader } from "@/components/ui/site-header";
import { safeRedirectTarget } from "@/lib/auth/redirect";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { requestSignInCode } from "../actions";

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
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Account
          </p>
          <h1 className="mt-5 text-[clamp(2.75rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Sign in to continue
          </h1>
          <p className="mt-6 max-w-[52ch] text-sm leading-6 text-contrast-high">
            Enter your email and we&apos;ll send a one-time code. No password
            to remember.
          </p>
        </header>

        <div className="min-w-0 lg:col-span-5 lg:col-start-8">
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
            <Button
              className="w-full sm:w-auto sm:justify-self-start"
              type="submit"
              variant="signal"
            >
              Send code
            </Button>
          </form>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
