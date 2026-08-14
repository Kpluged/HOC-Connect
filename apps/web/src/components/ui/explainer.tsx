import type { ReactNode } from "react";

export function Explainer({
  children,
  term,
}: {
  children: ReactNode;
  term: string;
}) {
  return (
    <details className="group border-b border-contrast-low py-3 text-sm">
      <summary className="min-h-11 cursor-pointer content-center font-semibold marker:text-contrast-medium">
        {term}
      </summary>
      <div className="max-w-[60ch] pb-2 text-contrast-high">{children}</div>
    </details>
  );
}
