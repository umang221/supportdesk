import { connectDB } from "@/server/utils/db";
import Team from "@/server/models/Team";
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
    const team = await Team.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
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
