import type { ReactNode } from "react";

export function MapPanel({
  children,
  label,
}: {
  children?: ReactNode;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      className="relative isolate min-h-80 overflow-hidden rounded-card border border-contrast-low bg-surface"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 h-px bg-contrast-low"
      />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 w-px bg-contrast-low"
      />
      <div className="relative z-10 p-5">{children}</div>
    </section>
  );
}
