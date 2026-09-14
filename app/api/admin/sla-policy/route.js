import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assertApiRole } from "@/lib/auth/authorization";
import { getEffectiveSlaPolicies, updateSlaPolicy } from "@/server/services/slaPolicyService";
import { validateSlaPolicyInput } from "@/server/validators/adminValidators";
import { toErrorResponse } from "@/server/utils/http-error";

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);
    const policies = await getEffectiveSlaPolicies();
    return NextResponse.json({ policies });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Upserts the policy for one priority (body: {priority, firstResponseMinutes, resolutionMinutes}). */
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    assertApiRole(user, ["admin"]);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const input = validateSlaPolicyInput(body);
    const updated = await updateSlaPolicy(input.priority, input, user);
    return NextResponse.json({ policy: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
