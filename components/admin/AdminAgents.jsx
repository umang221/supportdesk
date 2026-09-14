"use client";

import { useMemo, useState } from "react";
import { Avatar, Select, Button, Badge, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { ROLE_LIST } from "@/lib/constants/roles";
import { createAdminUser, updateAdminUser } from "@/lib/api/admin";
import { normalizeAdminAgent } from "@/lib/api/admin-adapter";

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);

function matchesSearch(agent, query) {
  if (!query) return true;
  return `${agent.name} ${agent.email} ${agent.title}`.toLowerCase().includes(query.toLowerCase());
}

function NewAgentForm({ teams, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { user } = await createAdminUser({ name, email, password, role, team: teamId || null });
      onCreated(normalizeAdminAgent(user));
      setName("");
      setEmail("");
      setPassword("");
      setRole("agent");
      setTeamId("");
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border-subtle p-space-md">
      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-agent-name">Name</label>
        <input
          id="new-agent-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-8 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-agent-email">Email</label>
        <input
          id="new-agent-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-8 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-agent-password">Temporary password</label>
        <input
          id="new-agent-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-8 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-agent-role">Role</label>
        <Select id="new-agent-role" value={role} onChange={(event) => setRole(event.target.value)}>
          {ROLE_LIST.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-label-sm text-text-tertiary" htmlFor="new-agent-team">Team</label>
        <Select id="new-agent-team" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
          <option value="">Unassigned</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="compact" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add agent"}
      </Button>
      {error ? <p className="w-full text-label-sm text-sla-critical-text">{error}</p> : null}
    </form>
  );
}

/** Agent roster with per-agent workload, role/team editing, and account creation — backed by /api/admin/users. */
export function AdminAgents({ agents: initialAgents, teams, tickets }) {
  const [agents, setAgents] = useState(initialAgents);
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState("all");
  const [pendingId, setPendingId] = useState(null);
  const [rowError, setRowError] = useState(null);

  const filtered = useMemo(() => {
    return agents
      .filter((agent) => (teamId === "all" ? true : agent.teamId === teamId))
      .filter((agent) => matchesSearch(agent, search));
  }, [agents, search, teamId]);

  async function handlePatch(agentId, patch) {
    setPendingId(agentId);
    setRowError(null);
    try {
      const { user } = await updateAdminUser(agentId, patch);
      const normalized = normalizeAdminAgent(user);
      setAgents((current) => current.map((agent) => (agent.id === agentId ? normalized : agent)));
    } catch (err) {
      setRowError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Agents</h1>
        <p className="text-body-sm text-text-tertiary">Every support agent, their role, team, and current ticket load.</p>
      </div>

      <NewAgentForm teams={teams} onCreated={(agent) => setAgents((current) => [...current, agent])} />

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

      {rowError ? <p className="text-body-sm text-sla-critical-text">{rowError}</p> : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-space-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No agents match these filters</p>
          <p className="text-body-sm text-text-tertiary">Try a different search term or team.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Team</TableHeaderCell>
                <TableHeaderCell className="w-32">Open</TableHeaderCell>
                <TableHeaderCell className="w-32">Total</TableHeaderCell>
                <TableHeaderCell className="w-28">Active</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => {
                const agentTickets = tickets.filter((ticket) => ticket.assigneeId === agent.id);
                const open = agentTickets.filter((ticket) => OPEN_STATUSES.has(ticket.status)).length;
                const isPending = pendingId === agent.id;

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
                    <TableCell>
                      <Select
                        value={agent.role}
                        disabled={isPending}
                        onChange={(event) => handlePatch(agent.id, { role: event.target.value })}
                      >
                        {ROLE_LIST.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={agent.teamId ?? ""}
                        disabled={isPending}
                        onChange={(event) => handlePatch(agent.id, { team: event.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{open}</TableCell>
                    <TableCell className="whitespace-nowrap">{agentTickets.length}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handlePatch(agent.id, { isActive: !agent.isActive })}
                        className="disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Badge variant={agent.isActive ? "healthy" : "muted"}>
                          {agent.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </button>
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
