import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { FieldShell } from "./field";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function Textarea({
  className,
  description,
  error,
  id,
  label,
  rows = 5,
  ...props
}: TextareaProps) {
  return (
    <FieldShell description={description} error={error} htmlFor={id} label={label}>
      <textarea
        aria-describedby={description || error ? `${id}-support` : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full resize-y rounded-field border border-contrast-low bg-surface-raised px-4 py-3 text-base text-primary placeholder:text-contrast-medium",
          className,
        )}
        id={id}
        rows={rows}
        {...props}
      />
    </FieldShell>
  );
}
