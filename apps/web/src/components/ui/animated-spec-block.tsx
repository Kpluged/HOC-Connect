"use client";

import { SpecBlock } from "@/components/ui/spec-block";
import { useCountUp } from "@/hooks/use-count-up";

export function AnimatedSpecBlock({
  caption,
  decimals = 0,
  footnote,
  label,
  unit,
  value,
}: {
  caption?: string;
  decimals?: number;
  footnote?: string;
  label: string;
  unit?: string;
  value: number;
}) {
  const { elementRef, value: animated } = useCountUp(value);

  return (
    <SpecBlock
      caption={caption}
      footnote={footnote}
      label={label}
      unit={unit}
      value={<span ref={elementRef as React.Ref<HTMLSpanElement>}>{animated.toFixed(decimals)}</span>}
    />
  );
}
