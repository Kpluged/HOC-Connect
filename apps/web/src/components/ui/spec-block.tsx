import type { ReactNode } from "react";

export function SpecBlock({
  caption,
  footnote,
  label,
  unit,
  value,
}: {
  caption?: ReactNode;
  footnote?: string;
  label: ReactNode;
  unit?: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="border-t border-contrast-low pt-4">
      <p className="text-sm text-contrast-medium">{label}</p>
      <div className="tabular-nums mt-5 flex items-end gap-2">
        <span className="text-[clamp(3.5rem,8vw,5.375rem)] font-normal leading-none tracking-[-0.05em]">
          {value}
        </span>
        {unit ? (
          <span className="pb-1 text-xl text-contrast-medium">{unit}</span>
        ) : null}
        {footnote ? (
          <sup className="self-start text-xs text-contrast-medium">{footnote}</sup>
        ) : null}
      </div>
      {caption ? (
        <p className="mt-4 max-w-[32ch] text-sm leading-6 text-contrast-high">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
