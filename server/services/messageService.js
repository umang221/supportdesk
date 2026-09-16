import { connectDB } from "@/server/utils/db";
import Message from "@/server/models/Message";
import Ticket from "@/server/models/Ticket";
import { isValidObjectId } from "@/server/validators/ticketValidators";
import { getSignedAttachmentUrl, assertUploadsConfigured } from "@/server/attachments/attachmentService";
import { publish, REALTIME_EVENTS } from "@/server/realtime/eventBus";
import { sendAgentReplyEmail, sendCustomerReplyEmail } from "@/server/email/emailService";

/**
 * Converts a Message document into the plain object returned to clients:
 * derives `type` for messages seeded before that field existed (see
 * server/models/Message.js), and regenerates a fresh signed URL for every
 * attachment rather than trusting whatever was last stored (there isn't a
 * stored URL at all — see the attachment sub-schema's comment).
 */
function presentMessage(messageDoc) {
  if (!messageDoc) return null;
  const message = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
  const type = message.type ?? (message.authorModel === "Customer" ? "customer_reply" : "agent_reply");
  const attachments = (message.attachments ?? []).map((attachment) => ({
    ...attachment,
    url: getSignedAttachmentUrl(attachment.publicId, attachment.resourceType),
  }));
  return { ...message, type, attachments };
}

/** Lists a ticket's messages oldest-first. Returns null if the ticket id is malformed or the ticket doesn't exist. */
export async function listMessagesForTicket(ticketId) {
  if (!isValidObjectId(ticketId)) return null;
  await connectDB();

  const ticketExists = await Ticket.exists({ _id: ticketId });
  if (!ticketExists) return null;

  const messages = await Message.find({ ticket: ticketId }).sort({ createdAt: 1 }).populate("author", "name email");
  return messages.map(presentMessage);
}

/**
 * Same as listMessagesForTicket, but strips internal notes before returning
 * — the customer-facing equivalent, used by the portal message route/page.
 * Filtering happens here (not left to the route or page) so a customer can
 * never see internal_note content no matter which caller forgets to filter.
 * Returns null under the same conditions as listMessagesForTicket.
 */
export async function listMessagesForCustomerTicket(ticketId) {
  const messages = await listMessagesForTicket(ticketId);
  if (!messages) return null;
  return messages.filter((message) => message.type !== "internal_note");
}

/**
 * Creates a message on a ticket and fires its corresponding email event.
 * `authorId`/`authorModel` are derived by the caller from the session, not
 * from client input — see app/api/tickets/[id]/messages/route.js (User
 * authors, any authenticated agent/team_lead/admin) and
 * app/api/portal/tickets/[id]/messages/route.js (Customer authors, the
 * session customer, and always isInternal:false — a customer can never
 * create an internal note).
 *
 * Returns null if the ticket doesn't exist.
 */
export async function createMessage({ ticketId, authorId, authorModel, body, isInternal = false, attachments = [] }) {
  if (!isValidObjectId(ticketId)) return null;
  if (attachments.length > 0) assertUploadsConfigured();
  await connectDB();

  const ticket = await Ticket.findById(ticketId)
    .populate("customer", "name email company")
    .populate("assignee", "name email");
  if (!ticket) return null;

  const type = isInternal ? "internal_note" : authorModel === "Customer" ? "customer_reply" : "agent_reply";

  if (type === "agent_reply" && !ticket.firstRespondedAt) {
    ticket.firstRespondedAt = new Date();
    await ticket.save();
  }

  const created = await Message.create({ ticket: ticket._id, author: authorId, authorModel, body, type, attachments });
  const populated = await created.populate("author", "name email");
  const presented = presentMessage(populated);

  publish(REALTIME_EVENTS.MESSAGE_CREATED, { ticketId: ticket._id.toString(), ...presented });

  // Internal notes are never visible to the customer and never generate a
  // customer- or agent-facing reply email.
  if (type === "agent_reply") {
    await sendAgentReplyEmail({ ticket, message: presented });
  } else if (type === "customer_reply") {
    await sendCustomerReplyEmail({ ticket, message: presented });
  }

  return presented;
}
