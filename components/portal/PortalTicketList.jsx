"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, SlaIndicator, Select } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { formatSlaCountdown } from "@/lib/utils/format-sla-countdown";
import { useLiveNow } from "@/lib/hooks/use-live-now";

function findMeta(list, value) {
  return list.find((item) => item.value === value);
}

function matchesSearch(ticket, query) {
  if (!query) return true;
  return `${ticket.ticketNumber ?? ticket.id} ${ticket.subject}`.toLowerCase().includes(query.toLowerCase());
}

/** Full list of the customer's own tickets, with search + status filter. */
export function PortalTicketList({ tickets, initialNow }) {
  const now = useLiveNow(initialNow);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return tickets
      .filter((ticket) => (status === "all" ? true : ticket.status === status))
      .filter((ticket) => matchesSearch(ticket, search))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [tickets, search, status]);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-subtle p-space-2xl text-center">
        <p className="text-body-md font-medium text-text-primary">No tickets yet</p>
        <p className="max-w-sm text-body-sm text-text-tertiary">
          Tickets you open with our support team will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-headline-md text-text-primary">My Tickets</h1>
        <Link href="/portal/tickets/new" className="text-label-sm font-medium text-primary hover:underline">
          New ticket
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative flex min-w-[200px] flex-1 items-center">
          <span className="sr-only">Search your tickets</span>
          <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by subject or ticket ID..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-card pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </label>

        <label className="sr-only" htmlFor="portal-status-filter">
          Filter by status
        </label>
        <Select id="portal-status-filter" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {STATUS_LIST.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border-subtle p-space-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No tickets match these filters</p>
          <p className="text-body-sm text-text-tertiary">Try a different search term or status.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((ticket) => {
            const statusMeta = findMeta(STATUS_LIST, ticket.status);
            const priorityMeta = findMeta(PRIORITY_LIST, ticket.priority);
            const sla = formatSlaCountdown(ticket, now);

            return (
              <li key={ticket.id}>
                <Link
                  href={`/portal/tickets/${ticket.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-card p-space-md transition-colors hover:border-border-strong hover:bg-surface-hover sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-medium text-text-primary">{ticket.subject}</p>
                    <p className="font-mono text-label-sm text-text-tertiary">{ticket.ticketNumber ?? ticket.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={priorityMeta?.badgeVariant}>{priorityMeta?.label ?? ticket.priority}</Badge>
                    <Badge variant={statusMeta?.badgeVariant}>{statusMeta?.label ?? ticket.status}</Badge>
                    <SlaIndicator variant={sla.variant} label={sla.label} />
                    <span className="text-label-sm text-text-tertiary">
                      {formatRelativeTime(ticket.updatedAt, now)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
