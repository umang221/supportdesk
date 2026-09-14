"use client";

/**
 * Client-side fetch wrappers for the on-demand ticket AI endpoints
 * (app/api/tickets/[id]/ai/*). Every call is explicitly triggered by an
 * agent action (a button click in TicketAiPanel) — nothing here is ever
 * called automatically.
 */

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

export async function fetchTicketSummary(ticketId) {
  const response = await fetch(`/api/tickets/${ticketId}/ai/summary`, { method: "POST" });
  return parseJsonResponse(response);
}

export async function fetchTicketSuggestion(ticketId) {
  const response = await fetch(`/api/tickets/${ticketId}/ai/suggestion`, { method: "POST" });
  return parseJsonResponse(response);
}

export async function fetchSuggestedReply(ticketId) {
  const response = await fetch(`/api/tickets/${ticketId}/ai/reply`, { method: "POST" });
  return parseJsonResponse(response);
}
