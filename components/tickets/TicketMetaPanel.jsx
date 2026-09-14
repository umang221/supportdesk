import { formatDateTime } from "@/lib/utils/format-datetime";

const CHANNEL_LABELS = { email: "Email", chat: "Chat", phone: "Phone" };

/** Ticket metadata: ID, channel, and the created/updated/due timestamps. */
export function TicketMetaPanel({ ticket }) {
  return (
    <div className="space-y-2 border-b border-border-subtle p-space-lg">
      <h3 className="text-label-sm font-medium text-text-secondary">Details</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-label-sm">
        <dt className="text-text-tertiary">Ticket ID</dt>
        <dd className="font-mono text-text-primary">{ticket.ticketNumber ?? ticket.id}</dd>

        <dt className="text-text-tertiary">Channel</dt>
        <dd className="text-text-primary">{CHANNEL_LABELS[ticket.channel] ?? ticket.channel}</dd>

        <dt className="text-text-tertiary">Created</dt>
        <dd className="text-text-primary">{formatDateTime(ticket.createdAt)}</dd>

        <dt className="text-text-tertiary">Updated</dt>
        <dd className="text-text-primary">{formatDateTime(ticket.updatedAt)}</dd>

        {ticket.dueAt ? (
          <>
            <dt className="text-text-tertiary">SLA due</dt>
            <dd className="text-text-primary">{formatDateTime(ticket.dueAt)}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
