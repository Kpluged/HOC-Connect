import Link from "next/link";

import { BrandLockup } from "@/components/ui/brand-lockup";
import { BrandMark } from "@/components/ui/brand-mark";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { PersonIcon } from "@/components/ui/icons";
import { OverlayNav } from "@/components/ui/overlay-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);

  if (overlay) {
    return (
      <header className="absolute inset-x-0 top-0 z-40 text-white">
        <div aria-hidden="true" className="absolute inset-0 border-b border-white/10 bg-gradient-to-b from-black/60 via-black/25 to-transparent backdrop-blur-[2px]" />
        <div className="page-shell relative grid h-24 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3 justify-self-start">
            <OverlayNav isSignedIn={isSignedIn} tone="inverse" />
          </div>
          <Link
            aria-label="HOC Elite Wheels home"
            className="justify-self-center"
            href="/"
          >
            <BrandWordmark className="whitespace-nowrap text-[clamp(1.65rem,3vw,2.8rem)] leading-none tracking-[-0.045em] text-white" />
          </Link>
          <div className="flex items-center gap-4 justify-self-end">
            <Link
              aria-label={isSignedIn ? "Your account" : "Sign in"}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-white/85 hover:text-white"
              href={isSignedIn ? "/account" : "/auth/sign-in"}
            >
              <PersonIcon className="size-5" />
            </Link>
            <Link aria-label="HOC Elite Wheels home" className="inline-flex min-h-11 items-center" href="/">
              <BrandMark className="h-9" priority size="small" />
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-40 border-b border-contrast-low bg-canvas">
      <div className="page-shell flex h-20 items-center justify-between gap-6">
        <BrandLockup />
        <div className="flex items-center gap-4">
          <Link
            aria-label={isSignedIn ? "Your account" : "Sign in"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-contrast-high hover:text-primary"
            href={isSignedIn ? "/account" : "/auth/sign-in"}
          >
            <PersonIcon className="size-5" />
          </Link>
          <OverlayNav isSignedIn={isSignedIn} />
        </div>
      </div>
    </header>
  );
}
