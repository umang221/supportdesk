"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Button } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { createAdminTeam } from "@/lib/api/admin";
import { normalizeAdminTeam } from "@/lib/api/admin-adapter";

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);

function matchesSearch(team, query) {
  if (!query) return true;
  return `${team.name} ${team.description}`.toLowerCase().includes(query.toLowerCase());
}

function TeamCard({ team, teamAgents, teamTickets }) {
  const open = teamTickets.filter((t) => OPEN_STATUSES.has(t.status)).length;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-space-lg">
      <div>
        <h3 className="text-body-md font-semibold text-text-primary">{team.name}</h3>
        <p className="text-body-sm text-text-tertiary">{team.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">{teamAgents.length} agents</Badge>
        <Badge variant="neutral">{teamTickets.length} tickets</Badge>
        <Badge variant={open > 0 ? "approaching" : "muted"}>{open} open</Badge>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        {teamAgents.length === 0 ? (
          <p className="text-label-sm text-text-tertiary">No agents assigned to this team yet.</p>
        ) : (
          teamAgents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2">
              <Avatar name={agent.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-body-sm text-text-primary">{agent.name}</p>
                <p className="truncate text-label-sm text-text-tertiary">{agent.title}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewTeamForm({ onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { team } = await createAdminTeam({ name, description });
      onCreated(normalizeAdminTeam(team));
      setName("");
      setDescription("");
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border-subtle p-space-md">
      <div className="flex flex-1 min-w-40 flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-team-name">Team name</label>
        <input
          id="new-team-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-8 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>
      <div className="flex flex-2 min-w-50 flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-team-description">Description</label>
        <input
          id="new-team-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="h-8 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>
      <Button type="submit" size="compact" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add team"}
      </Button>
      {error ? <p className="w-full text-label-sm text-sla-critical-text">{error}</p> : null}
    </form>
  );
}

/** Team roster: each team's description, headcount, ticket load, members, and creation — backed by /api/admin/teams. */
export function AdminTeams({ teams: initialTeams, agents, tickets }) {
  const [teams, setTeams] = useState(initialTeams);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => teams.filter((team) => matchesSearch(team, search)), [teams, search]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Teams</h1>
        <p className="text-body-sm text-text-tertiary">Team rosters and workload across the support org.</p>
      </div>

      <NewTeamForm onCreated={(team) => setTeams((current) => [...current, team])} />

      <label className="relative flex max-w-sm items-center">
        <span className="sr-only">Search teams</span>
        <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search teams..."
          className="h-9 w-full rounded-lg border border-border-subtle bg-surface-card pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-space-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No teams match this search</p>
          <p className="text-body-sm text-text-tertiary">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              teamAgents={agents.filter((agent) => agent.teamId === team.id)}
              teamTickets={tickets.filter((ticket) => ticket.teamId === team.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
