"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, Badge, Button } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { createAdminTeam, updateAdminTeam, deleteAdminTeam } from "@/lib/api/admin";
import { normalizeAdminTeam } from "@/lib/api/admin-adapter";

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);

function matchesSearch(team, query) {
  if (!query) return true;
  return `${team.name} ${team.description}`.toLowerCase().includes(query.toLowerCase());
}

function TeamCard({ team, teamAgents, teamTickets, onUpdated, onDeleted }) {
  const open = teamTickets.filter((t) => OPEN_STATUSES.has(t.status)).length;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startEditing() {
    setName(team.name);
    setDescription(team.description);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { team: updated } = await updateAdminTeam(team.id, { name, description });
      onUpdated(normalizeAdminTeam(updated));
      setIsEditing(false);
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${team.name}"? Agents in this team will become unassigned. Teams with existing tickets can't be deleted — reassign or resolve those first.`
      )
    ) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await deleteAdminTeam(team.id);
      onDeleted(team.id);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-card p-space-lg"
      >
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-text-tertiary" htmlFor={`team-name-${team.id}`}>
            Team name
          </label>
          <input
            id={`team-name-${team.id}`}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-8 rounded-md border border-border-subtle bg-canvas-bg px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-text-tertiary" htmlFor={`team-description-${team.id}`}>
            Description
          </label>
          <input
            id={`team-description-${team.id}`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-8 rounded-md border border-border-subtle bg-canvas-bg px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </div>
        {error ? <p className="text-label-sm text-sla-critical-text">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" size="compact" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="secondary" size="compact" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-space-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-body-md font-semibold text-text-primary">{team.name}</h3>
          <p className="text-body-sm text-text-tertiary">{team.description}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md px-2 py-1 text-label-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="rounded-md px-2 py-1 text-label-sm font-medium text-sla-critical-text hover:bg-sla-critical-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error ? <p className="text-label-sm text-sla-critical-text">{error}</p> : null}

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
              <Avatar name={agent.name} src={agent.avatarUrl} size="sm" />
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

/**
 * Team roster: each team's description, headcount, ticket load, members,
 * creation, rename, and deletion — backed by /api/admin/teams.
 * `initialTeams` only seeds local state on mount; app/admin/teams/page.js
 * remounts this component (via a `key` tied to the request) on every real
 * navigation, including browser back/forward — see the identical note in
 * AdminAgents.jsx.
 *
 * Membership (assigning/moving/removing an agent's team) is deliberately
 * not duplicated here — it's already fully functional on the Agents page
 * (per-agent Team select, see AdminAgents.jsx), so this only links there
 * rather than reimplementing the same control a second time.
 */
export function AdminTeams({ teams: initialTeams, agents, tickets }) {
  const [teams, setTeams] = useState(initialTeams);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => teams.filter((team) => matchesSearch(team, search)), [teams, search]);

  function handleUpdated(updatedTeam) {
    setTeams((current) => current.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)));
  }

  function handleDeleted(teamId) {
    setTeams((current) => current.filter((team) => team.id !== teamId));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-headline-md text-text-primary">Teams</h1>
          <p className="text-body-sm text-text-tertiary">Team rosters and workload across the support org.</p>
        </div>
        <Link href="/admin/agents" className="text-label-sm font-medium text-primary hover:underline">
          Manage agent assignments →
        </Link>
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
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
