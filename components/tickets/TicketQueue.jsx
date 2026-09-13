import { TableHeaderCell } from "@/components/ui";
import { SearchIcon, FilterIcon } from "@/components/ui/icons";
import { TicketRow } from "./TicketRow";

/**
 * Center pane: search + the filtered ticket table. Filtering/search state is
 * owned by AgentWorkspace — this component only renders what it's given.
 */
export function TicketQueue({
  tickets,
  getCustomer,
  getAssignee,
  selectedTicketId,
  onSelectTicket,
  search,
  onSearchChange,
  onToggleFilters,
  now,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-surface-card px-lg py-sm">
        <button
          type="button"
          onClick={onToggleFilters}
          aria-label="Toggle filters"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary lg:hidden"
        >
          <FilterIcon className="h-4 w-4" />
        </button>

        <label className="relative flex flex-1 items-center">
          <span className="sr-only">Search tickets</span>
          <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search this queue by subject, customer, or ticket ID..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-canvas-bg pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </label>

        <span className="shrink-0 text-label-sm text-text-tertiary">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-xl text-center">
            <p className="text-body-md font-medium text-text-primary">No tickets match these filters</p>
            <p className="text-body-sm text-text-tertiary">Try clearing a filter or adjusting your search.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <TableHeaderCell className="w-24">ID</TableHeaderCell>
                <TableHeaderCell>Subject</TableHeaderCell>
                <TableHeaderCell className="w-24">Priority</TableHeaderCell>
                <TableHeaderCell className="w-28">Status</TableHeaderCell>
                <TableHeaderCell className="w-40">Assignee</TableHeaderCell>
                <TableHeaderCell className="w-28">SLA</TableHeaderCell>
                <TableHeaderCell className="w-24">Updated</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  customer={getCustomer(ticket.customerId)}
                  assignee={ticket.assigneeId ? getAssignee(ticket.assigneeId) : null}
                  selected={ticket.id === selectedTicketId}
                  onSelect={() => onSelectTicket(ticket.id)}
                  now={now}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
