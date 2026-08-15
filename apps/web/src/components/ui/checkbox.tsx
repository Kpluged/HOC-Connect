import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function Checkbox({
  className,
  description,
  error,
  id,
  label,
  ...props
}: CheckboxProps) {
  const supportId = `${id}-support`;

  return (
    <div className="grid gap-2">
      <label className="flex min-h-11 cursor-pointer items-start gap-3" htmlFor={id}>
        <input
          aria-describedby={description || error ? supportId : undefined}
          aria-invalid={Boolean(error)}
          className={cn("mt-1 size-4 accent-[var(--signal)]", className)}
          id={id}
          type="checkbox"
          {...props}
        />
        <span className="text-sm font-semibold">{label}</span>
      </label>
      {error || description ? (
        <p
          className={cn(
            "pl-7 text-xs text-contrast-medium",
            error && "font-semibold text-primary",
          )}
          id={supportId}
        >
          {error ?? description}
        </p>
      ) : null}
    </div>
  );
}
