import { connectDB } from "@/server/utils/db";
import AuditLog from "@/server/models/AuditLog";

/**
 * Records one admin action. Called from admin-facing services
 * (userService, teamService, slaPolicyService) right after the write they
 * describe succeeds — never speculatively before, so the log never claims
 * an action happened when it didn't. `actingUser` is always the
 * server-derived session user (see lib/auth/session.js), never client input.
 */
export async function recordAudit({ actingUser, action, entityType, entityId, metadata = {} }) {
  await connectDB();
  await AuditLog.create({
    actor: actingUser.id,
    actorName: actingUser.name,
    actorEmail: actingUser.email,
    action,
    entityType,
    entityId: entityId ? String(entityId) : undefined,
    metadata,
  });
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/** Paginated, newest-first audit log listing for the admin audit screen. */
export async function listAuditLogs({ page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  await connectDB();

  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(limit, 10) || DEFAULT_PAGE_SIZE));

  const [entries, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
    AuditLog.countDocuments(),
  ]);

  return {
    entries,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}
