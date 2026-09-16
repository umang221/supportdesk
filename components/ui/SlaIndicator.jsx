import { cn } from "@/lib/utils/cn";

// Every state uses its darker "-text" token, not the base sla-* token — at
// this component's small size (text-sla-counter, 12px), the base colors
// (tuned for badge backgrounds/dots, not text on white) fall short of WCAG
// AA contrast; the "-text" variants clear it while keeping the same color
// meaning (green/amber/red).
const VARIANT_TEXT_CLASSES = {
  healthy: "text-sla-healthy-text",
  completed: "text-sla-healthy-text",
  approaching: "text-sla-approaching-text",
  critical: "text-sla-critical-text",
  breached: "text-sla-critical-text",
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
