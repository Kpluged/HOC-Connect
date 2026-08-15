import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandWordmark } from "@/components/ui/brand-wordmark";

/**
 * Immersive two-column shell (full-bleed vehicle photography left, focused
 * form right) shared by /auth/sign-in and /auth/verify - the "premium
 * minimalism, progressive disclosure" the design directive calls for on
 * auth-era UI. Deliberately drops SiteHeader/OverlayNav/MarketingFooter:
 * the wordmark + "Back to site" link are the only wayfinding needed on a
 * single-purpose auth screen.
 */
export function AuthSplitShell({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-2" data-room="light">
      <div className="relative hidden overflow-hidden bg-[#07090c] lg:block">
        <Image
          alt="HOC Elite Wheels electric vehicle"
          className="object-cover"
          fill
          priority
          quality={90}
          sizes="50vw"
          src="/auth/sign-in-hero.jpg"
        />
      </div>

      <div className="flex flex-col">
        <div className="page-shell flex min-h-20 items-center justify-between lg:px-12">
          <Link aria-label="HOC Elite Wheels home" href="/">
            <BrandWordmark className="text-2xl leading-none tracking-[-0.04em]" />
          </Link>
          <Link
            className="text-sm font-semibold text-contrast-medium hover:text-primary"
            href="/"
          >
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="page-shell w-full py-12 lg:px-12 lg:py-0">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast-medium">
                {eyebrow}
              </p>
              <h1 className="mt-4 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
                {title}
              </h1>
              <p className="mt-4 text-sm leading-6 text-contrast-high">{description}</p>
              <div className="mt-10">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
