import { cn } from "@/lib/utils/cn";

/**
 * Base surface for data cards, metric tiles, and panels.
 * Pass `interactive` for clickable cards (list items, nav tiles) that need a
 * hover state; leave it off for static content like metric summaries.
 */
export function Card({ interactive = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-surface-card p-lg",
        interactive && "cursor-pointer transition-colors hover:border-border-strong hover:bg-surface-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
