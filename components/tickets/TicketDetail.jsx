import { Badge, SlaIndicator, Avatar, Button } from "@/components/ui";
import { ChevronLeftIcon, SendIcon } from "@/components/ui/icons";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { TicketConversation } from "./TicketConversation";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-xl text-center">
      <p className="text-body-md font-medium text-text-primary">No ticket selected</p>
      <p className="text-body-sm text-text-tertiary">Choose a ticket from the queue to see its details.</p>
    </div>
  );
}

/**
 * Right-hand work area: ticket header, customer/assignee summary, the full
 * conversation, and a reply composer. The composer is presentational only —
 * sending replies is a future milestone once there's a backend to persist to.
 */
export function TicketDetail({ ticket, customer, assignee, messages, agentsById, now, onClose }) {
  if (!ticket) return <EmptyState />;

  const statusMeta = findMeta(STATUS_LIST, ticket.status);
  const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
  const sla = formatSlaCountdown(ticket, now);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border-subtle p-lg">
        <div className="flex items-start gap-2">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to queue"
              className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover xl:hidden"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-label-sm text-text-tertiary">{ticket.id}</p>
            <h2 className="text-headline-sm text-text-primary">{ticket.subject}</h2>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label}</Badge>
          <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label} priority</Badge>
          <SlaIndicator variant={sla.variant} label={sla.label} />
        </div>
      </div>

      <div className="shrink-0 space-y-3 border-b border-border-subtle p-lg">
        <div className="flex items-center gap-2">
          <Avatar name={customer?.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-body-sm font-medium text-text-primary">
              {customer?.name ?? "Unknown customer"}
            </p>
            <p className="truncate text-label-sm text-text-tertiary">
              {customer?.company} · {customer?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-label-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Avatar name={assignee?.name} size="sm" />
            {assignee?.name ?? "Unassigned"}
          </span>
          <span className="text-text-tertiary">Updated {formatRelativeTime(ticket.updatedAt, now)}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TicketConversation messages={messages} customer={customer} agentsById={agentsById} now={now} />
      </div>

      <div className="shrink-0 border-t border-border-subtle p-lg">
        <label className="sr-only" htmlFor="reply-composer">
          Write a reply
        </label>
        <textarea
          id="reply-composer"
          rows={3}
          placeholder="Write a reply..."
          className="w-full resize-none rounded-lg border border-border-subtle bg-canvas-bg p-sm text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
        <div className="mt-2 flex justify-end">
          <Button size="compact" disabled>
            <SendIcon className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
