import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { updateTeam, deleteTeam } from "@/server/services/teamService";
import { validateTeamPatchInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const patch = validateTeamPatchInput(body);
    const updated = await updateTeam(id, patch, user);
    if (!updated) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }
    return NextResponse.json({ team: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Deletes a team — refuses (409) if any ticket still references it (see
 * teamService.deleteTeam). Agents in the team are unassigned, not deleted.
 */
export async function DELETE(_request, { params }) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    const { id } = await params;
    const removed = await deleteTeam(id, user);
    if (!removed) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
