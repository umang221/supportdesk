"use client";

/**
 * Client-side fetch wrappers for the notification API routes
 * (app/api/notifications/*). Same conventions as lib/api/tickets.js: relies
 * on the browser's same-origin session cookie, throws an Error carrying the
 * server's status/code on a non-2xx response.
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

export async function fetchNotifications(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  const response = await fetch(`/api/notifications${qs ? `?${qs}` : ""}`);
  return parseJsonResponse(response);
}

export async function markNotificationRead(id) {
  const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  return parseJsonResponse(response);
}
