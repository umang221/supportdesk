import { TicketDetailHeader } from "./TicketDetailHeader";
import { TicketCustomerPanel } from "./TicketCustomerPanel";
import { TicketAssignmentPanel } from "./TicketAssignmentPanel";
import { TicketMetaPanel } from "./TicketMetaPanel";
import { TicketConversation } from "./TicketConversation";
import { TicketComposer } from "./TicketComposer";
import { TicketDetailSkeleton } from "./TicketDetailSkeleton";

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-space-xl text-center">
      <p className="text-body-md font-medium text-text-primary">No ticket selected</p>
      <p className="text-body-sm text-text-tertiary">Choose a ticket from the queue to see its details.</p>
    </div>
  );
}

/**
 * Right-hand work area: header (status/priority/SLA controls), customer and
 * assignment info, ticket metadata, the full conversation, and a reply/note
 * composer. `isLoading` shows a brief skeleton when switching tickets,
 * standing in for the network round-trip a real API-backed view would have.
 *
 * Status/priority/assignee edits and composed messages are lifted up to
 * AgentWorkspace as local, session-only state (`onStatusChange` etc.) — none
 * of it is persisted, since there's no backend yet.
 */
export function TicketDetail({
  ticket,
  customer,
  assignee,
  messages,
  agentsById,
  assignableAgents,
  now,
  isLoading,
  error,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onAddMessage,
  onClose,
}) {
  if (isLoading) return <TicketDetailSkeleton />;
  if (!ticket) return <EmptyState />;

  return (
    <div className="flex h-full flex-col">
      <TicketDetailHeader
        ticket={ticket}
        now={now}
        error={error}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TicketCustomerPanel customer={customer} />
        <TicketAssignmentPanel
          assignee={assignee}
          team={ticket.team}
          agents={assignableAgents ?? []}
          assigneeId={ticket.assigneeId}
          onAssigneeChange={onAssigneeChange}
        />
        <TicketMetaPanel ticket={ticket} />
        <TicketConversation messages={messages} customer={customer} agentsById={agentsById} now={now} />
      </div>

      <TicketComposer
        onSubmit={({ body, isInternal }) =>
          onAddMessage({
            id: `draft-${ticket.id}-${Date.now()}`,
            ticketId: ticket.id,
            authorType: "agent",
            authorName: "You",
            body,
            isInternal,
            createdAt: new Date(now).toISOString(),
          })
        }
      />
    </div>
  );
}
