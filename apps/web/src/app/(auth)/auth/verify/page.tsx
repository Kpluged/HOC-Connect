import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { safeRedirectTarget } from "@/lib/auth/redirect";
import { firstParam, type SearchParams } from "@/lib/search-params";

import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  description: "Enter the code sent to your email to finish signing in.",
  title: "Verify your email",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const email = firstParam(query, "email");
  const redirectTo = safeRedirectTarget(firstParam(query, "redirectTo"));

  if (!email) redirect("/auth/sign-in");

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Account
          </p>
          <h1 className="mt-5 text-[clamp(2.75rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            Check your email
          </h1>
          <p className="mt-6 max-w-[52ch] text-sm leading-6 text-contrast-high">
            We sent a verification code to <strong>{email}</strong>. Enter it
            below to continue.
          </p>
        </header>

        <div className="min-w-0 lg:col-span-5 lg:col-start-8">
          <VerifyForm email={email} redirectTo={redirectTo} />
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
