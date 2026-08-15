import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

export type FieldShellProps = {
  children: ReactNode;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
};

export function FieldShell({
  children,
  description,
  error,
  htmlFor,
  label,
}: FieldShellProps) {
  const supportId = `${htmlFor}-support`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error || description ? (
        <p
          className={cn(
            "text-xs text-contrast-medium",
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

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function Field({
  className,
  description,
  error,
  id,
  label,
  ...props
}: FieldProps) {
  return (
    <FieldShell
      description={description}
      error={error}
      htmlFor={id}
      label={label}
    >
      <input
        aria-describedby={description || error ? `${id}-support` : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-13 w-full rounded-field border border-contrast-low bg-surface-raised px-4 text-base text-primary placeholder:text-contrast-medium",
          className,
        )}
        id={id}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  description?: string;
  error?: string;
  id: string;
  label: string;
};

export function SelectField({
  children,
  className,
  description,
  error,
  id,
  label,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell
      description={description}
      error={error}
      htmlFor={id}
      label={label}
    >
      <select
        aria-describedby={description || error ? `${id}-support` : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-13 w-full rounded-field border border-contrast-low bg-surface-raised px-4 text-base text-primary",
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}
