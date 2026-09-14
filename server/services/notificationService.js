import { connectDB } from "@/server/utils/db";
import Notification from "@/server/models/Notification";
import { isValidObjectId } from "@/server/validators/ticketValidators";
import { publish, REALTIME_EVENTS } from "@/server/realtime/eventBus";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/**
 * Creates a notification and publishes it for realtime delivery. Not yet
 * wired to any trigger (ticket assignment, SLA breach, etc.) or exposed via
 * an API route — those triggers are a later Task 16 part. This exists now
 * as the primitive the realtime pipeline needs to have something to send.
 */
export async function createNotification({ type, message, recipient, relatedTicket }) {
  await connectDB();

  const notification = await Notification.create({ type, message, recipient, relatedTicket });
  const populated = await notification.populate("relatedTicket", "ticketNumber subject");

  publish(REALTIME_EVENTS.NOTIFICATION_CREATED, populated.toObject());
  return populated;
}

/**
 * Lists the given recipient's notifications, newest first, alongside their
 * total unread count (for a bell badge, independent of the current page).
 */
export async function listNotificationsForUser(recipientId, rawQuery = {}) {
  await connectDB();

  const page = Math.max(1, Number.parseInt(rawQuery.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(rawQuery.limit, 10) || DEFAULT_PAGE_SIZE));

  const filter = { recipient: recipientId };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("relatedTicket", "ticketNumber subject")
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);

  return {
    notifications,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    unreadCount,
  };
}

/**
 * Marks one notification read. Ownership is enforced here, not just in the
 * route: a notification can only be marked read by the user it was sent to,
 * so this looks it up scoped to `recipientId` rather than by id alone —
 * another user's notification simply doesn't match and comes back 404
 * rather than a distinguishable 403 that would confirm it exists.
 */
export async function markNotificationRead(id, recipientId) {
  if (!isValidObjectId(id)) return null;
  await connectDB();

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: recipientId },
    { $set: { read: true } },
    { returnDocument: "after" }
  ).populate("relatedTicket", "ticketNumber subject");

  return notification;
}
