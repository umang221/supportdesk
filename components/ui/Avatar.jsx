import { cn } from "@/lib/utils/cn";

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[10px]",
  default: "h-8 w-8 text-label-sm",
  lg: "h-10 w-10 text-body-sm",
};

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Initials avatar. Falls back to a generic silhouette when no `name` is
 * given, rather than inventing a placeholder person.
 */
export function Avatar({ name, size = "default", className, ...props }) {
  const initials = name ? getInitials(name) : "";

  return (
    <span
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : "true"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-container-high font-medium text-text-secondary",
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {initials || (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3/5 w-3/5">
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.7-8 6v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-3.3-3.6-6-8-6Z" />
        </svg>
      )}
    </span>
  );
}
