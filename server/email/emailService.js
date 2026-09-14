import { sendEmail } from "./emailProvider";

/**
 * One function per ticket lifecycle event this app currently generates.
 * Kept deliberately separate from ticketService/messageService/slaMonitorJob
 * (called as a side effect from each, never the other way around) so email
 * concerns don't leak into ticket/message/SLA business logic, and so the
 * calling code never has to know how a message gets composed or sent.
 *
 * Every function here swallows its own errors: a broken SMTP config or a
 * transient send failure must never fail the ticket/message write that
 * triggered it. Callers can fire-and-forget these (they already await them,
 * but a failure surfaces only as a console.error, never a thrown error).
 */

async function safeSend(to, subject, text) {
  try {
    return await sendEmail({ to, subject, text });
  } catch (error) {
    console.error("[email] send failed:", error);
    return null;
  }
}

export function sendTicketCreatedEmail(ticket) {
  const customerName = ticket.customer?.name ?? "there";
  return safeSend(
    ticket.customer?.email,
    `We've received your request (${ticket.ticketNumber})`,
    `Hi ${customerName},\n\nWe've created ticket ${ticket.ticketNumber}: "${ticket.subject}". Our team will follow up soon.\n\n— SupportDesk`
  );
}

export function sendTicketResolvedEmail(ticket) {
  const customerName = ticket.customer?.name ?? "there";
  return safeSend(
    ticket.customer?.email,
    `Your ticket ${ticket.ticketNumber} has been resolved`,
    `Hi ${customerName},\n\nYour ticket ${ticket.ticketNumber} ("${ticket.subject}") has been marked resolved. Reply if you need anything else.\n\n— SupportDesk`
  );
}

export function sendAgentReplyEmail({ ticket, message }) {
  const customerName = ticket.customer?.name ?? "there";
  const agentName = message.author?.name ?? "An agent";
  return safeSend(
    ticket.customer?.email,
    `New reply on your ticket ${ticket.ticketNumber}`,
    `Hi ${customerName},\n\n${agentName} replied on ticket ${ticket.ticketNumber}:\n\n"${message.body}"\n\n— SupportDesk`
  );
}

export function sendCustomerReplyEmail({ ticket, message }) {
  const customerName = ticket.customer?.name ?? "The customer";
  return safeSend(
    ticket.assignee?.email,
    `Customer replied on ${ticket.ticketNumber}`,
    `${customerName} replied on ticket ${ticket.ticketNumber}:\n\n"${message.body}"\n\n— SupportDesk`
  );
}

export function sendSlaApproachingEmail(ticket) {
  return safeSend(
    ticket.assignee?.email,
    `SLA approaching: ${ticket.ticketNumber}`,
    `Ticket ${ticket.ticketNumber} ("${ticket.subject}") is approaching its SLA deadline.\n\n— SupportDesk`
  );
}

export function sendSlaBreachedEmail(ticket) {
  return safeSend(
    ticket.assignee?.email,
    `SLA breached: ${ticket.ticketNumber}`,
    `Ticket ${ticket.ticketNumber} ("${ticket.subject}") has breached its SLA.\n\n— SupportDesk`
  );
}
