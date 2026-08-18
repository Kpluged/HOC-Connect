import { cn } from "@/lib/cn";

export type StatSegment = {
  /** Tailwind background utility mapping to a monochrome token, e.g. "bg-primary". */
  fill: string;
  label: string;
  value: number;
};

/**
 * A lightweight monochrome segmented proportion bar - the fleet-status
 * breakdown's "spatial viz" without pulling in a charting library (see the
 * Milestone 8+ plan's data-viz decision). Signal red is deliberately not
 * used here: every segment is a normal, non-alert state, so the bar stays
 * in the contrast ramp. The legend below doubles as the screen-reader /
 * no-color data alternative.
 */
export function StatBar({ segments }: { segments: StatSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const summary = segments
    .map((segment) => `${segment.label}: ${segment.value}`)
    .join(", ");

  return (
    <div>
      <div
        aria-label={summary}
        className="flex h-3 overflow-hidden rounded-control bg-contrast-lower"
        role="img"
      >
        {total > 0
          ? segments
              .filter((segment) => segment.value > 0)
              .map((segment) => (
                <div
                  className={cn("h-full", segment.fill)}
                  key={segment.label}
                  style={{ width: `${(segment.value / total) * 100}%` }}
                />
              ))
          : null}
      </div>
      <ul className="mt-4 grid gap-2">
        {segments.map((segment) => (
          <li className="flex items-center gap-2.5 text-sm" key={segment.label}>
            <span className={cn("size-2.5 rounded-full", segment.fill)} />
            <span className="text-contrast-medium">{segment.label}</span>
            <span className="ml-auto tabular-nums font-semibold">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
