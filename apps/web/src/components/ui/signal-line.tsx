import { cn } from "@/lib/cn";

export function SignalLine({
  className,
  live = false,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-24 w-px bg-contrast-low",
        live && "bg-signal",
        className,
      )}
    />
  );
}
