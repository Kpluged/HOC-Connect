import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { cn } from "@/lib/cn";

type OwnerSpaceSection =
  | "overview"
  | "dispatch"
  | "drivers"
  | "fleet"
  | "energy"
  | "maintenance";

const navItems: { href: string; key: OwnerSpaceSection; label: string }[] = [
  { href: "/space", key: "overview", label: "Overview" },
  { href: "/space/dispatch", key: "dispatch", label: "Dispatch" },
  { href: "/space/drivers", key: "drivers", label: "Drivers" },
  { href: "/space/fleet", key: "fleet", label: "Fleet" },
  { href: "/space/energy", key: "energy", label: "Energy" },
  { href: "/space/maintenance", key: "maintenance", label: "Maintenance" },
];

/**
 * Shared chrome for the top-level Owner Space pages: a header band with the
 * organisation name and a persistent section sub-nav the individual pages
 * previously lacked entirely. `active` is passed per page (server-rendered,
 * no client pathname hook needed).
 */
export function OwnerSpaceShell({
  active,
  children,
  organizationName,
}: {
  active: OwnerSpaceSection;
  children: ReactNode;
  organizationName: string;
}) {
  return (
    <main className="min-h-dvh bg-canvas" data-room="light">
      <SiteHeader />

      <div className="border-b border-contrast-low">
        <div className="page-shell pt-14 lg:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
            Owner Space
          </p>
          <h1 className="mt-4 text-[clamp(2.25rem,4.5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
            {organizationName}
          </h1>
          <nav aria-label="Owner Space sections" className="-mb-px mt-8 flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm font-semibold transition-colors duration-[var(--duration-hover)]",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-contrast-medium hover:text-primary",
                  )}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <section className="page-shell py-12 lg:py-16">{children}</section>
      <MarketingFooter />
    </main>
  );
}
