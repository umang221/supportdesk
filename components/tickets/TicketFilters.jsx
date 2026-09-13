import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { STATUS_LIST } from "@/lib/constants/statuses";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { SLA_STATE_LIST } from "@/lib/constants/sla-states";

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function FilterGroup({ title, children }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-label-sm font-medium text-text-secondary">{title}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-body-sm text-text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-border-strong accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-subtle"
      />
      {label}
    </label>
  );
}

/**
 * Queue filter panel (status / priority / assignee / SLA). Purely controlled
 * — all state lives in AgentWorkspace so the queue and filters stay in sync.
 */
export function TicketFilters({ filters, onFilterChange, onReset, agents, activeCount, className }) {
  return (
    <div className={cn("flex h-full flex-col gap-5 p-lg", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-label-md font-semibold text-text-primary">Filters</h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="text-label-sm text-primary hover:underline"
          >
            Clear ({activeCount})
          </button>
        ) : null}
      </div>

      <FilterGroup title="Status">
        {STATUS_LIST.map((status) => (
          <FilterCheckbox
            key={status.value}
            label={status.label}
            checked={filters.status.includes(status.value)}
            onChange={() => onFilterChange({ status: toggleValue(filters.status, status.value) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Priority">
        {PRIORITY_LIST.map((priority) => (
          <FilterCheckbox
            key={priority.value}
            label={priority.label}
            checked={filters.priority.includes(priority.value)}
            onChange={() =>
              onFilterChange({ priority: toggleValue(filters.priority, priority.value) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Assignee">
        <select
          value={filters.assigneeId}
          onChange={(event) => onFilterChange({ assigneeId: event.target.value })}
          className="h-8 w-full rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        >
          <option value="all">All agents</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="SLA">
        {SLA_STATE_LIST.map((sla) => (
          <FilterCheckbox
            key={sla.value}
            label={sla.label}
            checked={filters.slaState.includes(sla.value)}
            onChange={() => onFilterChange({ slaState: toggleValue(filters.slaState, sla.value) })}
          />
        ))}
      </FilterGroup>

      <Button variant="secondary" size="compact" onClick={onReset} className="mt-auto">
        Reset all filters
      </Button>
    </div>
  );
}
