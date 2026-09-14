import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { listTeams, createTeam } from "@/server/services/teamService";
import { validateTeamInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);
    const teams = await listTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const input = validateTeamInput(body);
    const team = await createTeam(input, user);
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
