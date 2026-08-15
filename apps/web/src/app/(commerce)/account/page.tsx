import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Your HOC Elite Wheels account overview.",
  title: "Account",
};

export default async function AccountPage() {
  const caller = await getServerCaller();
  const profile = await caller.profile.get();

  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />
      <section className="page-shell grid gap-12 pb-24 pt-16 lg:grid-cols-12 lg:pb-32 lg:pt-24">
        <header className="min-w-0 lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Account
          </p>
          <h1 className="mt-5 text-[clamp(2.75rem,5vw,5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            {profile?.fullName || "Your account"}
          </h1>
          {profile?.phone ? (
            <p className="mt-6 text-sm leading-6 text-contrast-high">
              {profile.phone}
            </p>
          ) : null}
        </header>

        <div className="min-w-0 lg:col-span-5 lg:col-start-8">
          <p className="text-sm font-semibold">Applications</p>
          <p className="mt-2 text-sm leading-6 text-contrast-medium">
            Track the status of your fleet applications and continue any
            still in progress.
          </p>
          <ButtonLink className="mt-6" href="/account/applications" variant="secondary">
            View applications
          </ButtonLink>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
