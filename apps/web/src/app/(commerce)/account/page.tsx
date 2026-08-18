import type { Metadata } from "next";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";
import { getServerCaller } from "@/server/trpc/caller";

export const metadata: Metadata = {
  description: "Your HOC Elite Wheels account overview.",
  title: "Account",
};

export default async function AccountPage() {
  const caller = await getServerCaller();
  const [profile, managedOrganization] = await Promise.all([
    caller.profile.get(),
    getCurrentManagedOrganization(),
  ]);

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
          <div className="grid gap-4">
            {managedOrganization ? (
              <div className="rounded-card border border-contrast-low bg-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-contrast-medium">
                  Workspace
                </p>
                <p className="mt-3 text-lg font-semibold">{managedOrganization.name}</p>
                <p className="mt-2 text-sm leading-6 text-contrast-medium">
                  Manage your drivers, fleet, and live assignments from your Owner
                  Space.
                </p>
                <ButtonLink className="mt-6 w-full sm:w-auto" href="/space" variant="signal">
                  Open workspace
                </ButtonLink>
              </div>
            ) : null}

            <div className="rounded-card border border-contrast-low p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-contrast-medium">
                Applications
              </p>
              <p className="mt-3 text-sm leading-6 text-contrast-medium">
                Track the status of your fleet applications and continue any still in
                progress.
              </p>
              <ButtonLink
                className="mt-6 w-full sm:w-auto"
                href="/account/applications"
                variant="secondary"
              >
                View applications
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
