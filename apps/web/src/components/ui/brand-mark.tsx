import Image from "next/image";

import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
  size?: "small" | "medium" | "large";
};

const sizeClasses = {
  small: "h-8 w-auto",
  medium: "h-12 w-auto",
  large: "h-24 w-auto",
};

export function BrandMark({
  className,
  priority = false,
  size = "medium",
}: BrandMarkProps) {
  return (
    <Image
      alt="HOC"
      className={cn("object-contain", sizeClasses[size], className)}
      height={373}
      priority={priority}
      src="/brand/hoc-logo.png"
      width={404}
    />
  );
}
