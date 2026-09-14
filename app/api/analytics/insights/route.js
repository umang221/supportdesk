import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAnalyticsSummary } from "@/server/services/analyticsService";
import { generateAnalyticsInsights } from "@/server/ai/aiService";
import { toErrorResponse } from "@/server/utils/http-error";

/** On-demand only (button click) — recomputes the current analytics summary server-side rather than trusting a client-supplied one, then asks Gemini to interpret it. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const summary = await getAnalyticsSummary();
    const result = await generateAnalyticsInsights(summary);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
