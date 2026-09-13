import { SlaIndicator, Select } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";

/**
 * Ticket header: ID/subject plus the status and priority controls. These
 * selects update local workspace state only (see AgentWorkspace's
 * `ticketOverrides`) — there's no backend yet to persist a real transition.
 */
export function TicketDetailHeader({ ticket, now, onStatusChange, onPriorityChange, onClose }) {
  const sla = formatSlaCountdown(ticket, now);

  return (
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
        <label className="sr-only" htmlFor="ticket-status">
          Status
        </label>
        <Select
          id="ticket-status"
          value={ticket.status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-7 text-label-sm"
        >
          {STATUS_LIST.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="ticket-priority">
          Priority
        </label>
        <Select
          id="ticket-priority"
          value={ticket.priority}
          onChange={(event) => onPriorityChange(event.target.value)}
          className="h-7 text-label-sm"
        >
          {PRIORITY_LIST.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label} priority
            </option>
          ))}
        </Select>

        <SlaIndicator variant={sla.variant} label={sla.label} />
      </div>
    </div>
  );
}
