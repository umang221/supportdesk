import { cn } from "@/lib/utils/cn";

const VARIANT_CLASSES = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
  secondary:
    "border border-border-subtle bg-surface-card text-text-primary hover:border-border-strong hover:bg-canvas-bg",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary",
};

const SIZE_CLASSES = {
  compact: "h-[30px] px-space-sm text-label-md",
  default: "h-9 px-space-md text-label-md",
  lg: "h-[42px] px-space-lg text-body-lg font-semibold",
};

/**
 * Base button primitive. Variants and sizes come from DESIGN.md's button spec.
 */
export function Button({
  variant = "primary",
  size = "default",
  type = "button",
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg transition active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-subtle focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
