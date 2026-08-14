import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { cn } from "@/lib/cn";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link
      aria-label="HOC Elite Wheels home"
      className={cn("inline-flex min-h-11 items-center gap-3", className)}
      href="/"
    >
      <BrandMark priority size="small" />
      <BrandWordmark className="text-[1.55rem] leading-none tracking-[-0.04em]" />
    </Link>
  );
}
