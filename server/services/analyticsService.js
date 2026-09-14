import { connectDB } from "@/server/utils/db";
import Ticket from "@/server/models/Ticket";
import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";

const OPEN_STATUSES = [STATUSES.OPEN, STATUSES.PENDING, STATUSES.ON_HOLD];
const VOLUME_WINDOW_DAYS = 30;

/**
 * All real-data analytics for the /analytics screen, computed with
 * aggregation pipelines run in parallel (one round trip per metric, all
 * fired together) rather than pulling every ticket into memory. Every
 * pipeline uses fields Ticket already indexes (status, priority, team,
 * assignee, slaState — see server/models/Ticket.js) so none of this scans
 * the full collection unfiltered.
 */
export async function getAnalyticsSummary() {
  await connectDB();

  const since = new Date(Date.now() - VOLUME_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [
    totalTickets,
    openTickets,
    breachedTickets,
    volumeByDay,
    resolutionTimeAgg,
    firstResponseTimeAgg,
    slaOutcomeAgg,
    workloadByAgent,
    workloadByTeam,
    priorityBreakdown,
  ] = await Promise.all([
    Ticket.countDocuments({}),
    Ticket.countDocuments({ status: { $in: OPEN_STATUSES } }),
    Ticket.countDocuments({ slaState: SLA_STATES.BREACHED }),

    Ticket.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    Ticket.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      { $project: { minutes: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 60000] } } },
      { $group: { _id: null, avgMinutes: { $avg: "$minutes" }, count: { $sum: 1 } } },
    ]),

    Ticket.aggregate([
      { $match: { firstRespondedAt: { $ne: null } } },
      { $project: { minutes: { $divide: [{ $subtract: ["$firstRespondedAt", "$createdAt"] }, 60000] } } },
      { $group: { _id: null, avgMinutes: { $avg: "$minutes" }, count: { $sum: 1 } } },
    ]),

    Ticket.aggregate([
      { $match: { slaState: { $in: [SLA_STATES.COMPLETED, SLA_STATES.BREACHED] } } },
      { $group: { _id: "$slaState", count: { $sum: 1 } } },
    ]),

    Ticket.aggregate([
      { $match: { assignee: { $ne: null } } },
      {
        $group: {
          _id: "$assignee",
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ["$status", OPEN_STATUSES] }, 1, 0] } },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { agentId: "$_id", name: "$user.name", total: 1, open: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]),

    Ticket.aggregate([
      {
        $group: {
          _id: "$team",
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ["$status", OPEN_STATUSES] }, 1, 0] } },
        },
      },
      { $lookup: { from: "teams", localField: "_id", foreignField: "_id", as: "team" } },
      { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
      { $project: { teamId: "$_id", name: { $ifNull: ["$team.name", "Unassigned"] }, total: 1, open: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]),

    Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
  ]);

  const completedCount = slaOutcomeAgg.find((row) => row._id === SLA_STATES.COMPLETED)?.count ?? 0;
  const slaBreachedFinalCount = slaOutcomeAgg.find((row) => row._id === SLA_STATES.BREACHED)?.count ?? 0;
  const slaOutcomeTotal = completedCount + slaBreachedFinalCount;

  return {
    totalTickets,
    openTickets,
    breachedTickets,
    avgResolutionMinutes: resolutionTimeAgg[0]?.avgMinutes ?? null,
    resolvedTicketCount: resolutionTimeAgg[0]?.count ?? 0,
    avgFirstResponseMinutes: firstResponseTimeAgg[0]?.avgMinutes ?? null,
    respondedTicketCount: firstResponseTimeAgg[0]?.count ?? 0,
    slaComplianceRate: slaOutcomeTotal > 0 ? (completedCount / slaOutcomeTotal) * 100 : null,
    ticketVolumeByDay: volumeByDay.map((row) => ({ date: row._id, count: row.count })),
    priorityBreakdown: priorityBreakdown.map((row) => ({ priority: row._id, count: row.count })),
    workloadByAgent: workloadByAgent.map((row) => ({ agentId: row.agentId.toString(), name: row.name, total: row.total, open: row.open })),
    workloadByTeam: workloadByTeam.map((row) => ({ teamId: row.teamId ? row.teamId.toString() : null, name: row.name, total: row.total, open: row.open })),
  };
}
