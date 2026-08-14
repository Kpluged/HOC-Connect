import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  heading,
  number,
}: {
  eyebrow?: ReactNode;
  heading: ReactNode;
  number: string;
}) {
  return (
    <header className="grid gap-5 border-t-2 border-primary pt-5 md:grid-cols-12">
      <div className="tabular-nums text-sm text-contrast-medium md:col-span-2">
        {number}
      </div>
      <div className="md:col-span-8">
        {eyebrow ? (
          <p className="mb-3 text-sm text-contrast-medium">{eyebrow}</p>
        ) : null}
        <h2 className="max-w-[18ch] text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
          {heading}
        </h2>
      </div>
    </header>
  );
}
