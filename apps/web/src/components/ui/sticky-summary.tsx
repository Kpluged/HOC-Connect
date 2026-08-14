import type { ReactNode } from "react";

export type SummaryRow = {
  label: string;
  value: ReactNode;
};

export function StickySummary({
  action,
  heading,
  rows,
}: {
  action?: ReactNode;
  heading: string;
  rows: SummaryRow[];
}) {
  return (
    <aside className="sticky top-6 border border-contrast-low bg-surface p-6">
      <h3 className="text-lg font-semibold">{heading}</h3>
      <dl className="mt-6 divide-y divide-contrast-low border-y border-contrast-low">
        {rows.map((row) => (
          <div className="flex justify-between gap-6 py-3" key={row.label}>
            <dt className="text-sm text-contrast-medium">{row.label}</dt>
            <dd className="tabular-nums text-right text-sm font-semibold">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {action ? <div className="mt-6">{action}</div> : null}
    </aside>
  );
}
