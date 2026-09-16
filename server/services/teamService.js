import { connectDB } from "@/server/utils/db";
import Team from "@/server/models/Team";
import User from "@/server/models/User";
import Ticket from "@/server/models/Ticket";
import { HttpError } from "@/server/utils/http-error";
import { recordAudit } from "@/server/services/auditService";

export async function listTeams() {
  await connectDB();
  return Team.find().sort({ name: 1 });
}

export async function createTeam({ name, description }, actingUser) {
  await connectDB();
  try {
    const team = await Team.create({ name, description });
    await recordAudit({
      actingUser,
      action: "team.create",
      entityType: "Team",
      entityId: team._id,
      metadata: { name: team.name },
    });
    return team;
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, "A team with this name already exists.", {
        code: "validation_error",
        fieldErrors: { name: "Must be unique." },
      });
    }
    throw error;
  }
}

export async function updateTeam(id, { name, description }, actingUser) {
  await connectDB();
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (description !== undefined) patch.description = description;

  try {
    const team = await Team.findByIdAndUpdate(id, { $set: patch }, { returnDocument: "after", runValidators: true });
    if (!team) return null;
    await recordAudit({
      actingUser,
      action: "team.update",
      entityType: "Team",
      entityId: team._id,
      metadata: patch,
    });
    return team;
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, "A team with this name already exists.", {
        code: "validation_error",
        fieldErrors: { name: "Must be unique." },
      });
    }
    throw error;
  }
}

/**
 * Deletes a team. Refuses outright if any ticket still references it —
 * unlike User.team, Ticket.team is a required field (every ticket must
 * belong to a team), so there's no safe "null it out" cascade the way
 * deleteUser unassigns a deleted agent's tickets; the admin must reassign
 * or resolve those tickets first. Agents are a different story: User.team
 * is optional, so agents in the team are unassigned (not deleted) rather
 * than blocking the delete — they remain fully intact accounts, just
 * without a team, matching how deleteUser unassigns (not deletes) a
 * removed agent's tickets. Returns null if the team doesn't exist.
 */
export async function deleteTeam(id, actingUser) {
  await connectDB();
  const team = await Team.findById(id);
  if (!team) return null;

  const hasTickets = await Ticket.exists({ team: team._id });
  if (hasTickets) {
    throw new HttpError(409, "Cannot delete a team with existing tickets. Reassign or resolve them first.", {
      code: "team_has_tickets",
    });
  }

  await User.updateMany({ team: team._id }, { $set: { team: null } });
  await team.deleteOne();

  await recordAudit({
    actingUser,
    action: "team.delete",
    entityType: "Team",
    entityId: id,
    metadata: { name: team.name },
  });

  return true;
}
