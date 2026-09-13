import { Avatar, Select } from "@/components/ui";

/**
 * Assignee (reassignable — local state only, see AgentWorkspace) and the
 * owning team, derived from the assignee's team when one is set.
 */
export function TicketAssignmentPanel({ assignee, team, agents, assigneeId, onAssigneeChange }) {
  return (
    <div className="space-y-2 border-b border-border-subtle p-lg">
      <h3 className="text-label-sm font-medium text-text-secondary">Assignment</h3>

      <div className="flex items-center gap-2">
        <Avatar name={assignee?.name} />
        <label className="sr-only" htmlFor="ticket-assignee">
          Assignee
        </label>
        <Select
          id="ticket-assignee"
          value={assigneeId ?? "unassigned"}
          onChange={(event) =>
            onAssigneeChange(event.target.value === "unassigned" ? null : event.target.value)
          }
          className="min-w-0 flex-1"
        >
          <option value="unassigned">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-label-sm text-text-tertiary">Team: {team?.name ?? "—"}</p>
    </div>
  );
}
