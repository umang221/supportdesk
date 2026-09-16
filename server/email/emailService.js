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

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

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

export function sendTicketAssignedEmail(ticket) {
  const agentName = ticket.assignee?.name ?? "there";
  return safeSend(
    ticket.assignee?.email,
    `You've been assigned ticket ${ticket.ticketNumber}`,
    `Hi ${agentName},\n\nYou've been assigned to ticket ${ticket.ticketNumber}: "${ticket.subject}".\n\n— SupportDesk`
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

/** Sent when an admin creates an agent account — the account has no usable password until this link is completed (see userService.createUser). */
export function sendAgentInviteEmail(user, token) {
  const link = `${APP_BASE_URL}/set-password?token=${token}`;
  return safeSend(
    user.email,
    "You've been invited to SupportDesk",
    `Hi ${user.name},\n\nAn admin created a SupportDesk agent account for you. Set your password to finish setting up your account:\n\n${link}\n\nThis link expires in 24 hours.\n\n— SupportDesk`
  );
}

/** Sent when an admin resets an agent's password on their behalf (e.g. they're locked out and can't self-serve). */
export function sendAgentPasswordResetEmail(user, token) {
  const link = `${APP_BASE_URL}/set-password?token=${token}`;
  return safeSend(
    user.email,
    "Reset your SupportDesk password",
    `Hi ${user.name},\n\nAn admin reset your SupportDesk password. Set a new one here:\n\n${link}\n\nThis link expires in 24 hours. If you didn't expect this, contact your admin.\n\n— SupportDesk`
  );
}

/** Sent from the customer portal's "Forgot password" flow. Only ever called for an email that already has an account — see customerAuthService.requestPasswordReset. */
export function sendCustomerPasswordResetEmail(customer, token) {
  const link = `${APP_BASE_URL}/portal/reset-password?token=${token}`;
  return safeSend(
    customer.email,
    "Reset your SupportDesk password",
    `Hi ${customer.name},\n\nWe received a request to reset your SupportDesk password. Reset it here:\n\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.\n\n— SupportDesk`
  );
}
