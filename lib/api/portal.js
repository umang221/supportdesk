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

export async function fetchPortalMessages(ticketId) {
  const response = await fetch(`/api/portal/tickets/${ticketId}/messages`);
  return parseJsonResponse(response);
}

export const postPortalMessage = (ticketId, { body, attachments }) =>
  postJson(`/api/portal/tickets/${ticketId}/messages`, { body, attachments });

/** Uploads one file for the given ticket from the customer portal; returns { attachment } metadata to pass back into postPortalMessage's `attachments`. */
export async function uploadPortalTicketAttachment(ticketId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`/api/portal/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData,
  });
  return parseJsonResponse(response);
}

export async function logoutCustomer() {
  const response = await fetch("/api/portal/auth/logout", { method: "POST" });
  return parseJsonResponse(response);
}
