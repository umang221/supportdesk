"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, SlaIndicator, Avatar } from "@/components/ui";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import { TicketConversation, TicketMetaPanel } from "@/components/tickets";
import { PortalReplyComposer } from "./PortalReplyComposer";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

const CLOSED_STATUSES = new Set(["resolved", "closed"]);

/**
 * Customer's read-only view of a single ticket: status/priority/SLA are
 * shown, never editable (those transitions are agent-only). Internal notes
 * are excluded before this component ever sees the message list — see
 * app/portal/tickets/[id]/page.js — so there's no risk of leaking them here.
 */
export function PortalTicketDetail({ ticket, customer, assignee, team, messages, agentsById, initialNow }) {
  const now = useLiveNow(initialNow);
  const [draftMessages, setDraftMessages] = useState([]);
  const statusMeta = findMeta(STATUS_LIST, ticket.status);
  const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
  const sla = formatSlaCountdown(ticket, now);
  const isClosed = CLOSED_STATUSES.has(ticket.status);

  function handleReply(body) {
    setDraftMessages((prev) => [
      ...prev,
      {
        id: `portal-draft-${ticket.id}-${Date.now()}`,
        ticketId: ticket.id,
        authorType: "customer",
        authorId: customer?.id,
        body,
        createdAt: new Date(now).toISOString(),
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/portal/tickets"
        className="inline-flex items-center gap-1 text-label-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to my tickets
      </Link>

      <div className="rounded-lg border border-border-subtle bg-surface-card">
        <div className="border-b border-border-subtle p-space-lg">
          <p className="font-mono text-label-sm text-text-tertiary">{ticket.ticketNumber ?? ticket.id}</p>
          <h1 className="text-headline-sm text-text-primary">{ticket.subject}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label ?? ticket.status}</Badge>
            <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label ?? ticket.priority}</Badge>
            <SlaIndicator variant={sla.variant} label={sla.label} />
          </div>

          {isClosed ? (
            <p className="mt-3 rounded-md bg-canvas-bg px-space-sm py-space-xs text-label-sm text-text-tertiary">
              This ticket is {statusMeta?.label?.toLowerCase() ?? "closed"}. Replying won&rsquo;t reopen it
              automatically — for anything new, our team will follow up here or you can open a new ticket.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-b border-border-subtle p-space-lg">
          <Avatar name={assignee?.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-body-sm text-text-primary">
              {assignee ? assignee.name : "Not yet assigned"}
            </p>
            <p className="truncate text-label-sm text-text-tertiary">{team?.name ?? "Support team"}</p>
          </div>
        </div>

        <TicketMetaPanel ticket={ticket} />

        <TicketConversation
          messages={[...messages, ...draftMessages]}
          customer={customer}
          agentsById={agentsById}
          now={now}
        />

        <PortalReplyComposer onSubmit={handleReply} />
      </div>
    </div>
  );
}
