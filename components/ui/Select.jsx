import { cn } from "@/lib/utils/cn";

/** Base select primitive for compact inline controls (status, priority, assignee, etc). */
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "h-8 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
