"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { agents as mockAgents, getMessagesByTicketId } from "@/lib/mock-data";
import { fetchTickets, fetchUsers, updateTicketStatus, updateTicketPriority, assignTicket } from "@/lib/api/tickets";
import { normalizeTicket, normalizeUser } from "@/lib/api/ticket-adapter";
import { TicketFilters } from "./TicketFilters";
import { TicketQueue } from "./TicketQueue";
import { TicketDetail } from "./TicketDetail";

const INITIAL_FILTERS = { status: [], priority: [], assigneeId: "all", slaState: [] };
const CLOCK_TICK_MS = 30_000;
// The ticket API paginates; this pulls the whole queue in one page so the
// existing client-side search/filter UX (built for the full mock array)
// keeps working unchanged. Revisit with real pagination if the queue ever
// needs to show more tickets than this.
const TICKET_LIST_LIMIT = 100;

function countActiveFilters(filters) {
  return (
    filters.status.length +
    filters.priority.length +
    filters.slaState.length +
    (filters.assigneeId !== "all" ? 1 : 0)
  );
}

function matchesSearch(ticket, query) {
  if (!query) return true;
  const haystack = `${ticket.ticketNumber ?? ticket.id} ${ticket.subject} ${ticket.customer?.name ?? ""} ${ticket.customer?.company ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

/**
 * Owns queue state (search, filters, selection) and composes the three-pane
 * workspace: filters | ticket queue | ticket detail. Tickets and the
 * assignable-agent roster come from the real, session-authenticated ticket
 * API (server/services/ticketService.js via app/api/tickets, app/api/users)
 * — status/priority/assignment edits call their dedicated API endpoints and
 * apply the server's authoritative result (including recalculated SLA
 * state) back into local state; they are never applied optimistically only.
 *
 * Message/conversation data has no backing API yet (out of scope for this
 * integration pass), so it's still read from the mock fixtures, joined by
 * `ticketNumber` — the seed script set every ticket's `ticketNumber` to its
 * corresponding mock ticket's id, so the join lines up.
 *
 * `initialNow` comes from the server (see app/tickets/page.js) and seeds the
 * `now` clock used for every relative-time/SLA-countdown calculation in this
 * subtree, to avoid a hydration mismatch against the server-rendered shell.
 */
export function AgentWorkspace({ initialNow }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [tickets, setTickets] = useState([]);
  const [assignableAgents, setAssignableAgents] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [now, setNow] = useState(initialNow);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [actionError, setActionError] = useState(null);
  // Session-only composed messages, never persisted: { [ticketId]: Message[] }
  const [draftMessagesByTicket, setDraftMessagesByTicket] = useState({});

  const loadTickets = useCallback(() => {
    return fetchTickets({ limit: TICKET_LIST_LIMIT })
      .then((data) => {
        const normalized = data.tickets.map(normalizeTicket);
        setTickets(normalized);
        setListError(null);
        setSelectedTicketId((current) => current ?? normalized[0]?.id ?? null);
      })
      .catch((error) => {
        setListError(error.message);
      })
      .finally(() => {
        setIsListLoading(false);
      });
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then((data) => {
        if (!cancelled) setAssignableAgents(data.users.map(normalizeUser));
      })
      .catch(() => {
        // The assignable-agent roster is a convenience for the filter and
        // reassignment dropdowns — if it fails to load, those just show no
        // options rather than breaking the rest of the workspace.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const mockAgentsById = useMemo(() => new Map(mockAgents.map((a) => [a.id, a])), []);

  // Every ticket already carries its own populated customer/assignee, so
  // rather than a separate fetch, these maps are just built from whatever
  // is currently in the queue — enough for TicketQueue/TicketRow's lookups.
  const customersById = useMemo(() => {
    const map = new Map();
    for (const ticket of tickets) if (ticket.customer) map.set(ticket.customerId, ticket.customer);
    return map;
  }, [tickets]);

  const assigneesById = useMemo(() => {
    const map = new Map();
    for (const ticket of tickets) if (ticket.assignee) map.set(ticket.assigneeId, ticket.assignee);
    return map;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
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
      if (!matchesSearch(ticket, search)) return false;

      return true;
    });
  }, [tickets, filters, search]);

  const selectedTicket = selectedTicketId ? tickets.find((t) => t.id === selectedTicketId) ?? null : null;

  function handleSelectTicket(ticketId) {
    setSelectedTicketId(ticketId);
    setActionError(null);
    setMobileDetailOpen(true);
  }

  function handleFilterChange(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleResetFilters() {
    setFilters(INITIAL_FILTERS);
  }

  function applyUpdatedTicket(rawTicket) {
    const updated = normalizeTicket(rawTicket);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setActionError(null);
  }

  async function handleStatusChange(status) {
    if (!selectedTicket) return;
    try {
      const { ticket } = await updateTicketStatus(selectedTicket.id, status);
      applyUpdatedTicket(ticket);
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function handlePriorityChange(priority) {
    if (!selectedTicket) return;
    try {
      const { ticket } = await updateTicketPriority(selectedTicket.id, priority);
      applyUpdatedTicket(ticket);
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function handleAssigneeChange(assigneeId) {
    if (!selectedTicket) return;
    try {
      const { ticket } = await assignTicket(selectedTicket.id, assigneeId);
      applyUpdatedTicket(ticket);
    } catch (error) {
      setActionError(error.message);
    }
  }

  function handleAddMessage(ticketId, message) {
    setDraftMessagesByTicket((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] ?? []), message],
    }));
  }

  const detailProps = selectedTicket
    ? {
        ticket: selectedTicket,
        customer: selectedTicket.customer,
        assignee: selectedTicket.assignee,
        messages: [
          ...getMessagesByTicketId(selectedTicket.ticketNumber),
          ...(draftMessagesByTicket[selectedTicket.id] ?? []),
        ],
        agentsById: mockAgentsById,
        assignableAgents,
        error: actionError,
        onStatusChange: handleStatusChange,
        onPriorityChange: handlePriorityChange,
        onAssigneeChange: handleAssigneeChange,
        onAddMessage: (message) => handleAddMessage(selectedTicket.id, message),
      }
    : { ticket: null };

  const filtersPanel = (
    <TicketFilters
      filters={filters}
      onFilterChange={handleFilterChange}
      onReset={handleResetFilters}
      agents={assignableAgents}
      activeCount={countActiveFilters(filters)}
    />
  );

  if (listError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-space-xl text-center">
        <p className="text-body-md font-medium text-text-primary">Couldn&rsquo;t load tickets</p>
        <p className="max-w-sm text-body-sm text-text-tertiary">{listError}</p>
        <button
          type="button"
          onClick={loadTickets}
          className="rounded-md border border-border-subtle px-space-md py-space-xs text-label-sm font-medium text-text-primary hover:bg-surface-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0">
      <WorkspaceLayout
        left={filtersPanel}
        center={
          <TicketQueue
            tickets={filteredTickets}
            getCustomer={(id) => customersById.get(id) ?? null}
            getAssignee={(id) => assigneesById.get(id) ?? null}
            selectedTicketId={selectedTicketId}
            onSelectTicket={handleSelectTicket}
            search={search}
            onSearchChange={setSearch}
            onToggleFilters={() => setMobileFiltersOpen(true)}
            now={now}
          />
        }
        right={<TicketDetail {...detailProps} now={now} isLoading={isListLoading} />}
      />

      {mobileDetailOpen ? (
        <div className="fixed inset-0 z-30 bg-surface-card xl:hidden">
          <TicketDetail
            {...detailProps}
            now={now}
            isLoading={isListLoading}
            onClose={() => setMobileDetailOpen(false)}
          />
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
