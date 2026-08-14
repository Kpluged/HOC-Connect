import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/cn";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link
      aria-label="HOC Connect home"
      className={cn("inline-flex min-h-11 items-center gap-3", className)}
      href="/"
    >
      <BrandMark priority size="small" />
      <span className="text-sm font-semibold tracking-[-0.02em]">
        HOC Connect
      </span>
    </Link>
  );
}
