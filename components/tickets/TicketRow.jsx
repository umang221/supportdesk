import { cn } from "@/lib/utils/cn";
import { TableRow, TableCell, Badge, SlaIndicator, Avatar } from "@/components/ui";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

/** Single row in the ticket queue table. */
export function TicketRow({ ticket, customer, assignee, selected, onSelect, now }) {
  const statusMeta = findMeta(STATUS_LIST, ticket.status);
  const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
  const sla = formatSlaCountdown(ticket, now);

  return (
    <TableRow
      selected={selected}
      onClick={onSelect}
      aria-selected={selected}
      className="cursor-pointer"
    >
      <TableCell className="whitespace-nowrap font-mono text-label-sm text-text-tertiary">
        {ticket.ticketNumber ?? ticket.id}
      </TableCell>
      <TableCell className="max-w-0">
        <div className="truncate font-medium text-text-primary">{ticket.subject}</div>
        <div className="truncate text-label-sm text-text-tertiary">
          {customer ? `${customer.name} · ${customer.company}` : "Unknown customer"}
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label ?? ticket.priority}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label ?? ticket.status}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Avatar name={assignee?.name} src={assignee?.avatarUrl} size="sm" />
          <span className={cn("truncate text-body-sm", !assignee && "text-text-tertiary italic")}>
            {assignee?.name ?? "Unassigned"}
          </span>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <SlaIndicator variant={sla.variant} label={sla.label} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-text-tertiary">
        {formatRelativeTime(ticket.updatedAt, now)}
      </TableCell>
    </TableRow>
  );
}
