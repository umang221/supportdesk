"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, SlaIndicator, Select, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { SLA_STATE_LIST } from "@/lib/constants/sla-states";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";
import { useLiveNow } from "@/lib/hooks/use-live-now";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

function matchesSearch(ticket, customer, query) {
  if (!query) return true;
  const haystack = `${ticket.id} ${ticket.subject} ${customer?.name ?? ""} ${customer?.company ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

const INITIAL_FILTERS = { status: "all", priority: "all", team: "all", slaState: "all" };

/**
 * Cross-team ticket + SLA management view. Unlike the agent workspace this
 * isn't a working queue with a detail pane — it's a filterable audit table
 * for spotting SLA risk across every team at once.
 */
export function AdminTicketsSla({ tickets, teams, customersById, teamsById, agentsById, initialNow }) {
  const now = useLiveNow(initialNow);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const filtered = useMemo(() => {
    return tickets
      .filter((ticket) => (filters.status === "all" ? true : ticket.status === filters.status))
      .filter((ticket) => (filters.priority === "all" ? true : ticket.priority === filters.priority))
      .filter((ticket) => (filters.team === "all" ? true : ticket.teamId === filters.team))
      .filter((ticket) => (filters.slaState === "all" ? true : ticket.slaState === filters.slaState))
      .filter((ticket) => matchesSearch(ticket, customersById.get(ticket.customerId), search))
      .sort((a, b) => new Date(a.dueAt ?? 0) - new Date(b.dueAt ?? 0));
  }, [tickets, filters, search, customersById]);

  const breachedCount = tickets.filter((t) => t.slaState === "breached").length;
  const criticalCount = tickets.filter((t) => t.slaState === "critical").length;

  function handleFilterChange(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Tickets &amp; SLA</h1>
        <p className="text-body-sm text-text-tertiary">Every ticket across every team, sorted by SLA urgency.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border-subtle bg-surface-card p-space-lg">
          <p className="text-label-sm text-text-tertiary">Total</p>
          <p className="text-headline-metric text-text-primary">{tickets.length}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-card p-space-lg">
          <p className="text-label-sm text-text-tertiary">Unassigned</p>
          <p className="text-headline-metric text-text-primary">{tickets.filter((t) => !t.assigneeId).length}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-card p-space-lg">
          <p className="text-label-sm text-text-tertiary">Critical</p>
          <p className="text-headline-metric text-sla-critical">{criticalCount}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-card p-space-lg">
          <p className="text-label-sm text-text-tertiary">Breached</p>
          <p className="text-headline-metric text-sla-critical">{breachedCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative flex min-w-[200px] flex-1 items-center">
          <span className="sr-only">Search tickets</span>
          <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by subject, customer, or ticket ID..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-card pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </label>

        <label className="sr-only" htmlFor="admin-ticket-status-filter">
          Filter by status
        </label>
        <Select
          id="admin-ticket-status-filter"
          value={filters.status}
          onChange={(event) => handleFilterChange({ status: event.target.value })}
        >
          <option value="all">All statuses</option>
          {STATUS_LIST.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="admin-ticket-priority-filter">
          Filter by priority
        </label>
        <Select
          id="admin-ticket-priority-filter"
          value={filters.priority}
          onChange={(event) => handleFilterChange({ priority: event.target.value })}
        >
          <option value="all">All priorities</option>
          {PRIORITY_LIST.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="admin-ticket-team-filter">
          Filter by team
        </label>
        <Select
          id="admin-ticket-team-filter"
          value={filters.team}
          onChange={(event) => handleFilterChange({ team: event.target.value })}
        >
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="admin-ticket-sla-filter">
          Filter by SLA state
        </label>
        <Select
          id="admin-ticket-sla-filter"
          value={filters.slaState}
          onChange={(event) => handleFilterChange({ slaState: event.target.value })}
        >
          <option value="all">All SLA states</option>
          {SLA_STATE_LIST.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-space-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No tickets match these filters</p>
          <p className="text-body-sm text-text-tertiary">Try clearing a filter or adjusting your search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <TableHeaderCell className="w-24">ID</TableHeaderCell>
                <TableHeaderCell>Subject</TableHeaderCell>
                <TableHeaderCell className="w-32">Team</TableHeaderCell>
                <TableHeaderCell className="w-40">Assignee</TableHeaderCell>
                <TableHeaderCell className="w-24">Priority</TableHeaderCell>
                <TableHeaderCell className="w-28">Status</TableHeaderCell>
                <TableHeaderCell className="w-32">SLA</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => {
                const statusMeta = findMeta(STATUS_LIST, ticket.status);
                const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
                const sla = formatSlaCountdown(ticket, now);
                const assignee = ticket.assigneeId ? agentsById.get(ticket.assigneeId) : null;
                const customer = customersById.get(ticket.customerId);

                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="whitespace-nowrap font-mono text-label-sm text-text-tertiary">
                      {ticket.id}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="truncate font-medium text-text-primary">{ticket.subject}</div>
                      <div className="truncate text-label-sm text-text-tertiary">
                        {customer ? `${customer.name} · ${customer.company}` : "Unknown customer"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {teamsById.get(ticket.teamId)?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar name={assignee?.name} size="sm" />
                        <span className="truncate text-body-sm">{assignee?.name ?? "Unassigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label ?? ticket.priority}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label ?? ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <SlaIndicator variant={sla.variant} label={sla.label} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
