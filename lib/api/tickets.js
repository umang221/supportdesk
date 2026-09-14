"use client";

/**
 * Client-side fetch wrappers for the ticket/user API routes
 * (app/api/tickets/*, app/api/users). Every call relies on the browser's
 * default same-origin cookie behavior for the session cookie — no token is
 * ever read or attached here. Errors from a non-2xx response are thrown as
 * an Error carrying the server's status/code/fieldErrors so callers can
 * show a meaningful message.
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
    error.fieldErrors = body?.fieldErrors;
    throw error;
  }

  return body;
}

function toQueryString(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export async function fetchTickets(query = {}) {
  const qs = toQueryString(query);
  const response = await fetch(`/api/tickets${qs ? `?${qs}` : ""}`);
  return parseJsonResponse(response);
}

export async function updateTicketStatus(id, status) {
  const response = await fetch(`/api/tickets/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseJsonResponse(response);
}

export async function updateTicketPriority(id, priority) {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority }),
  });
  return parseJsonResponse(response);
}

export async function assignTicket(id, assigneeId) {
  const response = await fetch(`/api/tickets/${id}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assigneeId }),
  });
  return parseJsonResponse(response);
}

export async function fetchUsers() {
  const response = await fetch("/api/users");
  return parseJsonResponse(response);
}
