"use client";

import { useMemo, useState } from "react";
import { Avatar, Select, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);

function matchesSearch(agent, query) {
  if (!query) return true;
  return `${agent.name} ${agent.email} ${agent.title}`.toLowerCase().includes(query.toLowerCase());
}

/** Agent roster with per-agent workload, searchable and filterable by team. */
export function AdminAgents({ agents, teams, tickets }) {
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState("all");

  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

  const filtered = useMemo(() => {
    return agents
      .filter((agent) => (teamId === "all" ? true : agent.teamId === teamId))
      .filter((agent) => matchesSearch(agent, search));
  }, [agents, search, teamId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Agents</h1>
        <p className="text-body-sm text-text-tertiary">Every support agent and their current ticket load.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative flex min-w-[200px] flex-1 items-center">
          <span className="sr-only">Search agents</span>
          <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or title..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-card pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </label>

        <label className="sr-only" htmlFor="admin-agent-team-filter">
          Filter by team
        </label>
        <Select id="admin-agent-team-filter" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No agents match these filters</p>
          <p className="text-body-sm text-text-tertiary">Try a different search term or team.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Team</TableHeaderCell>
                <TableHeaderCell className="w-32">Open</TableHeaderCell>
                <TableHeaderCell className="w-32">Total</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => {
                const agentTickets = tickets.filter((ticket) => ticket.assigneeId === agent.id);
                const open = agentTickets.filter((ticket) => OPEN_STATUSES.has(ticket.status)).length;

                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={agent.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-medium text-text-primary">{agent.name}</p>
                          <p className="truncate text-label-sm text-text-tertiary">{agent.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      {teamsById.get(agent.teamId)?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{open}</TableCell>
                    <TableCell className="whitespace-nowrap">{agentTickets.length}</TableCell>
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
