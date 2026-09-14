import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAnalyticsSummary } from "@/server/services/analyticsService";
import { toErrorResponse } from "@/server/utils/http-error";

/** Real MongoDB-backed analytics — any authenticated staff member may view it, matching the existing unrestricted ticket-visibility model (see app/api/tickets/route.js). Never touches Gemini. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const summary = await getAnalyticsSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
