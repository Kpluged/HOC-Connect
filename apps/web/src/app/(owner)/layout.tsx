import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { OwnerSpaceOnlyNotice } from "@/components/owner/owner-space-only-notice";
import { SiteHeader } from "@/components/ui/site-header";
import { getCurrentManagedOrganization } from "@/lib/server/current-organization";

export default async function OwnerSpaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const organization = await getCurrentManagedOrganization();

  if (!organization) {
    return (
      <main className="min-h-dvh bg-canvas" data-room="light">
        <SiteHeader />
        <section className="page-shell py-16 lg:py-24">
          <OwnerSpaceOnlyNotice />
        </section>
        <MarketingFooter />
      </main>
    );
  }

  return children;
}
