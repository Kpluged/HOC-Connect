import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ChipVariant = "neutral" | "selected" | "live" | "inactive";

const chipVariants: Record<ChipVariant, string> = {
  neutral: "border-contrast-low bg-transparent text-contrast-high",
  selected: "border-primary bg-primary text-canvas",
  live: "border-signal bg-signal text-on-signal",
  inactive: "border-contrast-low bg-surface text-contrast-medium",
};

export function Chip({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: ChipVariant }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-control border px-3 text-xs font-semibold",
        chipVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
