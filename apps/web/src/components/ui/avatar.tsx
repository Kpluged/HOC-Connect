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

const sizeClass = {
  xs: "size-8 text-xs",
  sm: "size-10 text-sm",
  md: "size-14 text-lg",
  lg: "size-20 text-2xl",
  xl: "size-28 text-4xl",
} as const;

export type AvatarSize = keyof typeof sizeClass;

/**
 * A driver's photo when one has been uploaded, falling back to a monogram of
 * their initials. Both share the same circle so the roster reads consistently
 * whether or not a photo exists. The photo is served from a signed, expiring
 * Storage URL, so a plain <img> is used rather than next/image (whose optimizer
 * would cache the token). Decorative: the name always appears as real text
 * beside it, so the avatar is hidden from the accessibility tree.
 */
export function Avatar({
  name,
  photoUrl,
  size = "sm",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const box = cn("shrink-0 rounded-full", sizeClass[size], className);

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed, expiring Supabase Storage URL
      <img
        alt=""
        aria-hidden="true"
        className={cn(box, "object-cover ring-1 ring-inset ring-black/10 shadow-[0_1px_4px_rgba(0,0,0,0.14)]")}
        src={photoUrl}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        "inline-flex items-center justify-center bg-surface font-semibold text-primary ring-1 ring-inset ring-black/[0.06]",
      )}
    >
      {initialsFrom(name)}
    </span>
  );
}
