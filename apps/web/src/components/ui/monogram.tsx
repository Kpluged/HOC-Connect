import { cn } from "@/lib/cn";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]!)
    .join("")
    .toUpperCase();
}

/**
 * Initials avatar for drivers - a restrained premium touch that needs no
 * uploaded imagery. Decorative: the driver's name always appears as real
 * text beside it, so this is hidden from the accessibility tree.
 */
export function Monogram({
  className,
  name,
}: {
  className?: string;
  name: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary",
        className,
      )}
    >
      {initialsFrom(name)}
    </span>
  );
}
