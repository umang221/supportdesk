"use client";

/**
 * Client-side fetch wrappers for the signed-in staff user's own account
 * (app/api/users/me/*). Same conventions as lib/api/tickets.js.
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

export async function updateOwnProfile(patch) {
  const response = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJsonResponse(response);
}

export async function changeOwnPassword({ currentPassword, newPassword }) {
  const response = await fetch("/api/users/me/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return parseJsonResponse(response);
}

export async function uploadOwnAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/users/me/avatar", { method: "POST", body: formData });
  return parseJsonResponse(response);
}
