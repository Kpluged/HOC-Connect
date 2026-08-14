import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function BrandWordmark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("hoc-wordmark", className)} {...props}>
      HOC Elite Wheels
    </span>
  );
}
