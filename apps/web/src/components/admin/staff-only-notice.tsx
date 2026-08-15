import { ButtonLink } from "@/components/ui/button";

export function StaffOnlyNotice() {
  return (
    <div className="border-l-2 border-signal bg-surface p-8">
      <p className="font-semibold">This area is limited to HOC staff.</p>
      <p className="mt-2 text-sm leading-6 text-contrast-medium">
        Your account doesn&apos;t have an active staff role. If you believe
        this is a mistake, contact HOC directly.
      </p>
      <ButtonLink className="mt-6" href="/" variant="secondary">
        Return home
      </ButtonLink>
    </div>
  );
}
