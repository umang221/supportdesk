import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";

/** Message thread for the selected ticket, oldest first. */
export function TicketConversation({ messages, customer, agentsById, now }) {
  if (messages.length === 0) {
    return (
      <p className="p-lg text-body-sm text-text-tertiary">
        No messages yet on this ticket.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4 p-lg">
      {messages.map((message) => {
        const isAgent = message.authorType === "agent";
        const authorName = isAgent ? agentsById.get(message.authorId)?.name : customer?.name;

        return (
          <li key={message.id} className="flex gap-3">
            <Avatar name={authorName} size="sm" className="mt-0.5 shrink-0" />
            <div className={cn("min-w-0 flex-1 rounded-lg border p-md", isAgent ? "border-accent-subtle bg-accent-subtle" : "border-border-subtle bg-surface-card")}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-label-sm font-medium text-text-primary">
                  {authorName ?? "Unknown"}
                  {isAgent ? (
                    <span className="ml-1.5 rounded bg-primary/10 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Agent
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-label-sm text-text-tertiary">
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
