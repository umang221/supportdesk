"use client";

/** Client-side fetch wrappers for the customer portal's auth + ticket-creation routes (app/api/portal/*). Same conventions as lib/api/tickets.js. */

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

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response);
}

export const registerCustomer = (input) => postJson("/api/portal/auth/register", input);
export const loginCustomer = (input) => postJson("/api/portal/auth/login", input);
export const requestCustomerPasswordReset = (input) => postJson("/api/portal/auth/forgot-password", input);
export const resetCustomerPassword = (input) => postJson("/api/portal/auth/reset-password", input);
export const createPortalTicket = (input) => postJson("/api/portal/tickets", input);

export async function logoutCustomer() {
  const response = await fetch("/api/portal/auth/logout", { method: "POST" });
  return parseJsonResponse(response);
}
