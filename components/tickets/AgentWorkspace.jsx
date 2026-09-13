"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { agents, customers, tickets, getMessagesByTicketId } from "@/lib/mock-data";
import { TicketFilters } from "./TicketFilters";
import { TicketQueue } from "./TicketQueue";
import { TicketDetail } from "./TicketDetail";

const INITIAL_FILTERS = { status: [], priority: [], assigneeId: "all", slaState: [] };
const CLOCK_TICK_MS = 30_000;

function countActiveFilters(filters) {
  return (
    filters.status.length +
    filters.priority.length +
    filters.slaState.length +
    (filters.assigneeId !== "all" ? 1 : 0)
  );
}

function matchesSearch(ticket, customer, query) {
  if (!query) return true;
  const haystack = `${ticket.id} ${ticket.subject} ${customer?.name ?? ""} ${customer?.company ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

/**
 * Owns queue state (search, filters, selection) and composes the three-pane
 * workspace: filters | ticket queue | ticket detail. Data comes from
 * lib/mock-data — swapping that module for a real API later shouldn't
 * require changes here beyond the import.
 *
 * `initialNow` comes from the server (see app/tickets/page.js) and seeds the
 * `now` clock used for every relative-time/SLA-countdown calculation in this
 * subtree. The first client render (hydration) must reuse that exact value
 * rather than calling Date.now() itself, or the server- and client-rendered
 * text would differ and React would throw a hydration mismatch. Once mounted,
 * an interval advances the clock so countdowns keep updating live.
 */
export function AgentWorkspace({ initialNow }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id ?? null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const customersById = useMemo(() => new Map(customers.map((c) => [c.id, c])), []);
  const agentsById = useMemo(() => new Map(agents.map((a) => [a.id, a])), []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const customer = customersById.get(ticket.customerId);

      if (filters.status.length && !filters.status.includes(ticket.status)) return false;
      if (filters.priority.length && !filters.priority.includes(ticket.priority)) return false;
      if (filters.slaState.length && !filters.slaState.includes(ticket.slaState)) return false;
      if (filters.assigneeId === "unassigned" && ticket.assigneeId) return false;
      if (
        filters.assigneeId !== "all" &&
        filters.assigneeId !== "unassigned" &&
        ticket.assigneeId !== filters.assigneeId
      ) {
        return false;
      }
      if (!matchesSearch(ticket, customer, search)) return false;

      return true;
    });
  }, [filters, search, customersById]);

  const selectedTicket = selectedTicketId
    ? filteredTickets.find((t) => t.id === selectedTicketId) ?? tickets.find((t) => t.id === selectedTicketId)
    : null;

  function handleSelectTicket(ticketId) {
    setSelectedTicketId(ticketId);
    setMobileDetailOpen(true);
  }

  function handleFilterChange(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleResetFilters() {
    setFilters(INITIAL_FILTERS);
  }

  const detailProps = selectedTicket
    ? {
        ticket: selectedTicket,
        customer: customersById.get(selectedTicket.customerId),
        assignee: selectedTicket.assigneeId ? agentsById.get(selectedTicket.assigneeId) : null,
        messages: getMessagesByTicketId(selectedTicket.id),
        agentsById,
      }
    : { ticket: null };

  const filtersPanel = (
    <TicketFilters
      filters={filters}
      onFilterChange={handleFilterChange}
      onReset={handleResetFilters}
      agents={agents}
      activeCount={countActiveFilters(filters)}
    />
  );

  return (
    <div className="relative h-full min-h-0">
      <WorkspaceLayout
        left={filtersPanel}
        center={
          <TicketQueue
            tickets={filteredTickets}
            getCustomer={(id) => customersById.get(id)}
            getAssignee={(id) => agentsById.get(id)}
            selectedTicketId={selectedTicketId}
            onSelectTicket={handleSelectTicket}
            search={search}
            onSearchChange={setSearch}
            onToggleFilters={() => setMobileFiltersOpen(true)}
            now={now}
          />
        }
        right={<TicketDetail {...detailProps} now={now} />}
      />

      {mobileDetailOpen ? (
        <div className="fixed inset-0 z-30 bg-surface-card xl:hidden">
          <TicketDetail {...detailProps} now={now} onClose={() => setMobileDetailOpen(false)} />
        </div>
      ) : null}

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-border-subtle bg-surface-card shadow-xl"
          >
            {filtersPanel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
