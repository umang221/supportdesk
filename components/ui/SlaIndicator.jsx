import { cn } from "@/lib/utils/cn";

const VARIANT_TEXT_CLASSES = {
  healthy: "text-sla-healthy",
  completed: "text-sla-healthy",
  approaching: "text-sla-approaching",
  critical: "text-sla-critical",
  breached: "text-sla-critical",
  paused: "text-text-tertiary",
};

/**
 * Inline SLA countdown, e.g. "● 3h 21m" or "● 12m overdue".
 * Color alone never carries the meaning: the wrapper's aria-label states the
 * state in words for assistive tech, since the visible dot/text is decorative.
 */
export function SlaIndicator({ variant = "healthy", label, className, ...props }) {
  return (
    <span
      role="status"
      aria-label={`SLA ${variant}: ${label}`}
      className={cn(
        "inline-flex items-center gap-1 text-sla-counter",
        VARIANT_TEXT_CLASSES[variant],
        className
      )}
      {...props}
    >
      <span aria-hidden="true">●</span>
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
