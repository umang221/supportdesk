"use client";

/**
 * Client-side fetch wrappers for the admin-only API routes
 * (app/api/admin/*). Every route is restricted server-side to the "admin"
 * role (see lib/auth/authorization.js's assertApiRole) regardless of what
 * calls it here.
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

export async function fetchAdminUsers() {
  const response = await fetch("/api/admin/users");
  return parseJsonResponse(response);
}

export async function createAdminUser(input) {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonResponse(response);
}

export async function updateAdminUser(id, patch) {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJsonResponse(response);
}

export async function deleteAdminUser(id) {
  const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  return parseJsonResponse(response);
}

export async function resetAdminUserPassword(id) {
  const response = await fetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
  return parseJsonResponse(response);
}

export async function fetchAdminTeams() {
  const response = await fetch("/api/admin/teams");
  return parseJsonResponse(response);
}

export async function createAdminTeam(input) {
  const response = await fetch("/api/admin/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonResponse(response);
}

export async function updateAdminTeam(id, patch) {
  const response = await fetch(`/api/admin/teams/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJsonResponse(response);
}

export async function deleteAdminTeam(id) {
  const response = await fetch(`/api/admin/teams/${id}`, { method: "DELETE" });
  return parseJsonResponse(response);
}

export async function fetchSlaPolicies() {
  const response = await fetch("/api/admin/sla-policy");
  return parseJsonResponse(response);
}

export async function updateSlaPolicy(input) {
  const response = await fetch("/api/admin/sla-policy", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonResponse(response);
}

export async function fetchAuditLog(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  const response = await fetch(`/api/admin/audit${qs ? `?${qs}` : ""}`);
  return parseJsonResponse(response);
}
