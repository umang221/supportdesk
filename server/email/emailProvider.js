import nodemailer from "nodemailer";

/**
 * Transport selection for outgoing email. Credentials only ever come from
 * server-side env vars (EMAIL_HOST/PORT/USER/PASSWORD/FROM) — this module is
 * never imported by client code, and nothing here is exposed under
 * `NEXT_PUBLIC_*`.
 *
 * "Explicitly configured" means all three of EMAIL_HOST/EMAIL_USER/
 * EMAIL_PASSWORD are set, regardless of NODE_ENV. Without them (the default
 * in local development, and in any environment nobody has configured yet),
 * every send goes through a log transport that never opens a network
 * connection — safe to run against real seeded data without risking a real
 * email going anywhere.
 *
 * Cached on `global` for the same reason as connectDB/eventBus: Next dev
 * mode clears the module cache on every hot reload, which would otherwise
 * reconstruct the transport (and re-check env) on every edit.
 */

function isSmtpConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
}

function createLogTransport() {
  return {
    async sendMail(message) {
      console.log(`[email:dev-log] would send "${message.subject}" to ${message.to}`);
      return { messageId: "dev-log", accepted: [message.to] };
    },
  };
}

function createSmtpTransport() {
  const port = Number(process.env.EMAIL_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
}

function getTransport() {
  if (!global._emailTransport) {
    global._emailTransport = isSmtpConfigured() ? createSmtpTransport() : createLogTransport();
  }
  return global._emailTransport;
}

const DEFAULT_FROM = "SupportDesk <no-reply@supportdesk.local>";

/** Sends one email. No-ops (returns null) if there's no recipient — e.g. an unassigned ticket has no agent to notify. */
export async function sendEmail({ to, subject, text, html }) {
  if (!to) return null;
  const transport = getTransport();
  return transport.sendMail({ from: process.env.EMAIL_FROM || DEFAULT_FROM, to, subject, text, html });
}

export function isUsingLogTransport() {
  return !isSmtpConfigured();
}
