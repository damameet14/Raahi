import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-raahi-600 text-white hover:bg-raahi-700 disabled:bg-raahi-300",
  secondary:
    "bg-surface-secondary text-text-primary hover:bg-surface-tertiary border border-[color:var(--color-border-primary)]",
  ghost: "bg-transparent text-raahi-700 hover:bg-surface-secondary",
};

export function PrimaryButton({
  variant = "primary",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...buttonProps
}: PrimaryButtonProps) {
  return (
    <button
      {...buttonProps}
      disabled={disabled || isLoading}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
