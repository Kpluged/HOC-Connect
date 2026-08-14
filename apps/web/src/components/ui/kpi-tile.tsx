import type { ReactNode } from "react";

export function KpiTile({
  label,
  note,
  unit,
  value,
}: {
  label: ReactNode;
  note?: ReactNode;
  unit?: ReactNode;
  value: ReactNode;
}) {
  return (
    <article className="rounded-card bg-frosted p-5 backdrop-blur-xl">
      <p className="text-sm text-contrast-medium">{label}</p>
      <p className="tabular-nums mt-8 text-4xl font-semibold tracking-[-0.04em]">
        {value}
        {unit ? (
          <span className="ml-2 text-base font-normal text-contrast-medium">
            {unit}
          </span>
        ) : null}
      </p>
      {note ? (
        <p className="mt-4 text-xs text-contrast-medium">{note}</p>
      ) : null}
    </article>
  );
}
