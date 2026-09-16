"use client";

import Link from "next/link";
import { Card, Badge, SlaIndicator } from "@/components/ui";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";
import { useLiveNow } from "@/lib/hooks/use-live-now";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);
const NEEDS_ATTENTION_SLA = new Set(["approaching", "critical", "breached"]);

function MetricCard({ label, value }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-label-sm text-text-tertiary">{label}</span>
      <span className="text-headline-metric text-text-primary">{value}</span>
    </Card>
  );
}

function AttentionRow({ ticket, customer, team, now }) {
  const statusMeta = findMeta(STATUS_LIST, ticket.status);
  const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
  const sla = formatSlaCountdown(ticket, now);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-card p-space-md sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium text-text-primary">{ticket.subject}</p>
        <p className="truncate text-label-sm text-text-tertiary">
          {ticket.id} · {customer?.name ?? "Unknown customer"} · {team?.name ?? "Unassigned team"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label ?? ticket.priority}</Badge>
        <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label ?? ticket.status}</Badge>
        <SlaIndicator variant={sla.variant} label={sla.label} />
      </div>
    </div>
  );
}

function TeamSummaryCard({ team, teamTickets }) {
  const open = teamTickets.filter((t) => OPEN_STATUSES.has(t.status)).length;
  const breached = teamTickets.filter((t) => t.slaState === "breached").length;

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-body-sm font-medium text-text-primary">{team.name}</p>
      <div className="flex flex-wrap items-center gap-3 text-label-sm text-text-tertiary">
        <span>{teamTickets.length} total</span>
        <span>{open} open</span>
        {breached > 0 ? <span className="text-sla-critical-text">{breached} breached</span> : null}
      </div>
    </Card>
  );
}

/**
 * Admin overview: org-wide ticket health at a glance — totals, tickets
 * needing attention across every team, and a per-team breakdown. Unlike the
 * agent workspace this has no selection/detail pane; it's a summary
 * dashboard, not a working queue.
 */
export function AdminOverview({ tickets, customersById, teamsById, teams, initialNow }) {
  const now = useLiveNow(initialNow);

  const openCount = tickets.filter((t) => OPEN_STATUSES.has(t.status)).length;
  const resolvedCount = tickets.filter((t) => !OPEN_STATUSES.has(t.status)).length;
  const unassignedCount = tickets.filter((t) => !t.assigneeId).length;
  const needsAttention = tickets
    .filter((t) => OPEN_STATUSES.has(t.status) && NEEDS_ATTENTION_SLA.has(t.slaState))
    .sort((a, b) => new Date(a.dueAt ?? 0) - new Date(b.dueAt ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Admin Overview</h1>
        <p className="text-body-sm text-text-tertiary">Ticket health and workload across every team.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total tickets" value={tickets.length} />
        <MetricCard label="Open" value={openCount} />
        <MetricCard label="Resolved" value={resolvedCount} />
        <MetricCard label="Unassigned" value={unassignedCount} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-label-md font-semibold text-text-primary">Needs attention</h2>
        {needsAttention.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle p-space-lg text-center">
            <p className="text-body-sm text-text-tertiary">Nothing at risk right now — every open ticket is within SLA.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {needsAttention.map((ticket) => (
              <AttentionRow
                key={ticket.id}
                ticket={ticket}
                customer={customersById.get(ticket.customerId)}
                team={teamsById.get(ticket.teamId)}
                now={now}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-label-md font-semibold text-text-primary">Teams</h2>
          <Link href="/admin/teams" className="text-label-sm text-primary hover:underline">
            Manage teams
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {teams.map((team) => (
            <TeamSummaryCard
              key={team.id}
              team={team}
              teamTickets={tickets.filter((t) => t.teamId === team.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
