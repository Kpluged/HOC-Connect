import { ButtonLink } from "@/components/ui/button";

export function OwnerSpaceOnlyNotice() {
  return (
    <div className="border-l-2 border-signal bg-surface p-8">
      <p className="font-semibold">You don&apos;t manage an organization yet.</p>
      <p className="mt-2 text-sm leading-6 text-contrast-medium">
        Owner Space is available once you&apos;re an active owner or
        dispatcher on an approved organization. If you believe this is a
        mistake, contact HOC directly.
      </p>
      <ButtonLink className="mt-6" href="/" variant="secondary">
        Return home
      </ButtonLink>
    </div>
  );
}
