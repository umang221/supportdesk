/**
 * Adapts admin API JSON (Mongo `_id`, ObjectId refs) into the flat shape
 * the admin components expect — same idToString convention as
 * lib/api/ticket-adapter.js, kept as a separate module since these shapes
 * are admin-specific (agents/teams/audit entries, not tickets).
 */

function idToString(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : value.toString();
}

export function normalizeAdminAgent(user) {
  if (!user) return null;
  return {
    id: idToString(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title ?? "",
    teamId: idToString(user.team),
    isActive: user.isActive,
  };
}

export function normalizeAdminTeam(team) {
  if (!team) return null;
  return {
    id: idToString(team._id),
    name: team.name,
    description: team.description ?? "",
  };
}

export function normalizeAuditEntry(entry) {
  if (!entry) return null;
  return {
    id: idToString(entry._id),
    actorName: entry.actorName,
    actorEmail: entry.actorEmail,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    createdAt: entry.createdAt,
  };
}
