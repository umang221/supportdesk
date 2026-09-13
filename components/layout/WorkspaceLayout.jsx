import { cn } from "@/lib/utils/cn";

/**
 * Three-column layout for ticket-workspace-style screens (queue filters /
 * ticket list / context inspector) — the shape the Agent Workspace (context
 * doc §7) will use. Side columns progressively hide on narrower viewports so
 * the center queue, the primary content, always stays usable.
 */
export function WorkspaceLayout({ left, center, right, className }) {
  return (
    <div className={cn("flex h-full min-h-0", className)}>
      {left ? (
        <div className="hidden w-56 shrink-0 overflow-y-auto border-r border-border-subtle bg-surface-card lg:block">
          {left}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 overflow-y-auto">{center}</div>

      {right ? (
        <div className="hidden w-96 shrink-0 overflow-y-auto border-l border-border-subtle bg-surface-card xl:block">
          {right}
        </div>
      ) : null}
    </div>
  );
}
