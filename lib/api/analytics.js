"use client";

async function parseJsonResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // No/invalid JSON body — fall through with body left null.
  }

  if (!response.ok) {
    const error = new Error(body?.error ?? `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }

  return body;
}

export async function fetchAnalyticsSummary() {
  const response = await fetch("/api/analytics");
  return parseJsonResponse(response);
}

/** On-demand only — triggered by the "Generate AI Insights" button, never automatically. */
export async function fetchAnalyticsInsights() {
  const response = await fetch("/api/analytics/insights", { method: "POST" });
  return parseJsonResponse(response);
}
