import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { formatDateTime } from "@/lib/utils/format-datetime";

/**
 * Message thread for the selected ticket, oldest first. Customer replies,
 * agent replies, and internal notes (`message.isInternal`) are styled
 * distinctly so it's never ambiguous what the customer will actually see.
 * `message.authorName` overrides the agentsById/customer lookup for
 * locally-composed drafts (see AgentWorkspace) that aren't in the mock data.
 */
export function TicketConversation({ messages, customer, agentsById, now }) {
  if (messages.length === 0) {
    return (
      <p className="p-space-lg text-body-sm text-text-tertiary">
        No messages yet on this ticket.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4 p-space-lg">
      {messages.map((message) => {
        const isAgent = message.authorType === "agent";
        const isInternal = Boolean(message.isInternal);
        const authorName = message.authorName ?? (isAgent ? agentsById.get(message.authorId)?.name : customer?.name);

        return (
          <li key={message.id} className="flex gap-3">
            <Avatar name={authorName} size="sm" className="mt-0.5 shrink-0" />
            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border p-space-md",
                isInternal
                  ? "border-sla-approaching-border bg-sla-approaching-bg"
                  : isAgent
                    ? "border-accent-subtle bg-accent-subtle"
                    : "border-border-subtle bg-surface-card"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-label-sm font-medium text-text-primary">
                  {authorName ?? "Unknown"}
                  {isInternal ? (
                    <span className="ml-1.5 rounded bg-sla-approaching-text/10 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-sla-approaching-text">
                      Internal note
                    </span>
                  ) : isAgent ? (
                    <span className="ml-1.5 rounded bg-primary/10 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Agent
                    </span>
                  ) : null}
                </span>
                <span
                  className="shrink-0 text-label-sm text-text-tertiary"
                  title={formatDateTime(message.createdAt)}
                >
                  {formatRelativeTime(message.createdAt, now)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-body-sm text-text-primary">{message.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
