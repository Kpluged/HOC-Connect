import { cn } from "@/lib/cn";

export function StatusDot({
  label,
  live = false,
}: {
  label: string;
  live?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-contrast-high">
      <span
        aria-hidden="true"
        className={cn(
          "relative block size-2 rounded-full bg-contrast-medium",
          live &&
            "signal-pulse bg-signal after:absolute after:inset-0 after:-z-10 after:rounded-full after:bg-signal",
        )}
      />
      {label}
    </span>
  );
}
