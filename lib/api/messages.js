"use client";

/**
 * Client-side fetch wrappers for the ticket message API
 * (app/api/tickets/[id]/messages, app/api/tickets/[id]/attachments). Same
 * conventions as lib/api/tickets.js.
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

export async function fetchTicketMessages(ticketId) {
  const response = await fetch(`/api/tickets/${ticketId}/messages`);
  return parseJsonResponse(response);
}

export async function postTicketMessage(ticketId, { body, isInternal, attachments }) {
  const response = await fetch(`/api/tickets/${ticketId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, isInternal, attachments }),
  });
  return parseJsonResponse(response);
}

/** Uploads one file for the given ticket; returns { attachment } metadata to pass back into postTicketMessage's `attachments`. */
export async function uploadTicketAttachment(ticketId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData,
  });
  return parseJsonResponse(response);
}
