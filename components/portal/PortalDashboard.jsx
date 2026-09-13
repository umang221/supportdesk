"use client";

import Link from "next/link";
import { Card, Button, Badge, SlaIndicator } from "@/components/ui";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";
import { useLiveNow } from "@/lib/hooks/use-live-now";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);
const NEEDS_ATTENTION_SLA = new Set(["approaching", "critical", "breached"]);

function SummaryCard({ label, count }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-label-sm text-text-tertiary">{label}</span>
      <span className="text-headline-metric text-text-primary">{count}</span>
    </Card>
  );
}

function TicketLine({ ticket, now }) {
  const statusMeta = findMeta(STATUS_LIST, ticket.status);
  const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
  const sla = formatSlaCountdown(ticket, now);

  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-card p-space-md transition-colors hover:border-border-strong hover:bg-surface-hover"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium text-text-primary">{ticket.subject}</p>
        <p className="font-mono text-label-sm text-text-tertiary">{ticket.id}</p>
      </div>
      <Badge variant={priorityMeta?.badgeVariant} className="shrink-0">
        {priorityMeta?.label ?? ticket.priority}
      </Badge>
      <Badge variant={statusMeta?.badgeVariant} className="shrink-0">
        {statusMeta?.label ?? ticket.status}
      </Badge>
      <SlaIndicator variant={sla.variant} label={sla.label} className="shrink-0" />
      <span className="shrink-0 text-label-sm text-text-tertiary">
        {formatRelativeTime(ticket.updatedAt, now)}
      </span>
    </Link>
  );
}

/**
 * Portal home: a quick summary of the customer's own tickets plus a
 * shortlist of the ones that need attention, so they don't have to open the
 * full ticket list just to see what's going on.
 */
export function PortalDashboard({ customer, tickets, initialNow }) {
  const now = useLiveNow(initialNow);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-subtle p-space-2xl text-center">
        <p className="text-body-md font-medium text-text-primary">
          Welcome, {customer?.name?.split(" ")[0] ?? "there"}
        </p>
        <p className="max-w-sm text-body-sm text-text-tertiary">
          You don&rsquo;t have any support tickets yet. If something&rsquo;s not working right, let us know.
        </p>
        <Link href="/portal/tickets/new">
          <Button>Create your first ticket</Button>
        </Link>
      </div>
    );
  }

  const openCount = tickets.filter((t) => OPEN_STATUSES.has(t.status)).length;
  const resolvedCount = tickets.filter((t) => !OPEN_STATUSES.has(t.status)).length;
  const needsAttention = tickets
    .filter((t) => OPEN_STATUSES.has(t.status) && NEEDS_ATTENTION_SLA.has(t.slaState))
    .sort((a, b) => new Date(a.dueAt ?? 0) - new Date(b.dueAt ?? 0));
  const recent = [...tickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-text-primary">
            Welcome back, {customer?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-body-sm text-text-tertiary">Here&rsquo;s what&rsquo;s happening with your tickets.</p>
        </div>
        <Link href="/portal/tickets/new">
          <Button>New ticket</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="Open" count={openCount} />
        <SummaryCard label="Resolved" count={resolvedCount} />
        <SummaryCard label="Total" count={tickets.length} />
      </div>

      {needsAttention.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-label-md font-semibold text-text-primary">Needs attention</h2>
          <div className="flex flex-col gap-2">
            {needsAttention.map((ticket) => (
              <TicketLine key={ticket.id} ticket={ticket} now={now} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-label-md font-semibold text-text-primary">Recent tickets</h2>
          <Link href="/portal/tickets" className="text-label-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {recent.map((ticket) => (
            <TicketLine key={ticket.id} ticket={ticket} now={now} />
          ))}
        </div>
      </div>
    </div>
  );
}
