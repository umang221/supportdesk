import { cn } from "@/lib/utils/cn";

const VARIANT_CLASSES = {
  healthy: "border-sla-healthy-border bg-sla-healthy-bg text-sla-healthy-text",
  approaching: "border-sla-approaching-border bg-sla-approaching-bg text-sla-approaching-text",
  critical: "border-sla-critical-border bg-sla-critical-bg text-sla-critical-text",
  neutral: "border-status-open-border bg-status-open-bg text-status-open-text",
  muted: "border-transparent bg-badge-neutral-bg text-badge-neutral-text",
};

/**
 * Status pill for ticket state, priority, category, etc.
 * For inline SLA countdowns (the "● 3h 21m" style), use SlaIndicator instead.
 */
export function Badge({ variant = "muted", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-sm py-xs text-label-sm",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
