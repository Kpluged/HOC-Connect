import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "solid" | "secondary" | "outline" | "text" | "signal" | "glass";

const buttonBase =
  "inline-flex min-h-13 items-center justify-center gap-2 rounded-control px-6 text-[0.9375rem] font-semibold leading-none transition-colors duration-[var(--duration-hover)] disabled:cursor-not-allowed disabled:opacity-40";

const buttonVariants: Record<ButtonVariant, string> = {
  solid: "bg-primary text-canvas hover:bg-contrast-high",
  secondary: "bg-surface text-primary hover:bg-contrast-lower",
  outline:
    "border border-contrast-low bg-transparent text-primary hover:bg-contrast-lower",
  text: "min-h-11 px-2 text-primary underline-offset-4 hover:underline",
  signal: "bg-signal text-on-signal hover:opacity-80",
  glass:
    "border border-white/15 bg-black/20 text-white backdrop-blur-xl hover:bg-white/12",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, type = "button", variant = "solid", ...props },
  ref,
) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], className)}
      ref={ref}
      type={type}
      {...props}
    />
  );
});

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
};

export function ButtonLink({
  children,
  className,
  href,
  variant = "solid",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonBase, buttonVariants[variant], className)}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
