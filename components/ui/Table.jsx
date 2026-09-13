import { cn } from "@/lib/utils/cn";

/** Column header cell — uppercase, muted, sits on the canvas tint. */
export function TableHeaderCell({ className, children, ...props }) {
  return (
    <th
      className={cn(
        "border-b border-border-subtle bg-canvas-bg px-space-md py-space-sm text-left text-[11px] font-medium uppercase tracking-wide text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

/**
 * Table row for queue/list views. Pass `selected` for the 2px accent-border
 * treatment used by keyboard/click selection.
 */
export function TableRow({ selected = false, className, children, ...props }) {
  return (
    <tr
      className={cn(
        "h-12 border-b border-border-subtle bg-surface-card transition-colors hover:bg-canvas-bg",
        selected && "border-l-2 border-l-primary bg-canvas-bg",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

/** Standard data cell — pair with TableRow. */
export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn("px-space-md py-space-sm align-middle text-body-sm text-text-primary", className)} {...props}>
      {children}
    </td>
  );
}
