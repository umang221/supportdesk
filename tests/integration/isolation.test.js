import { describe, it, expect, afterAll } from "vitest";
import Notification from "@/server/models/Notification";
import User from "@/server/models/User";
import Message from "@/server/models/Message";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import { createNotification, markNotificationRead, listNotificationsForUser } from "@/server/services/notificationService";
import { createMessage, listMessagesForTicket } from "@/server/services/messageService";
import { createTicket } from "@/server/services/ticketService";
import { createTestUser, createTestTeam, createTestCustomer } from "../helpers/factories";

const createdUserIds = [];
const createdNotificationIds = [];
const createdTicketIds = [];
const createdTeamIds = [];
const createdCustomerIds = [];

afterAll(async () => {
  await Notification.deleteMany({ _id: { $in: createdNotificationIds } });
  await Message.deleteMany({ ticket: { $in: createdTicketIds } });
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

describe("notification ownership isolation", () => {
  it("cannot be marked read by anyone other than its recipient", async () => {
    const { user: recipient } = await createTestUser();
    createdUserIds.push(recipient._id);
    const { user: otherUser } = await createTestUser();
    createdUserIds.push(otherUser._id);

    const notification = await createNotification({
      type: "ticket_assigned",
      message: "Test notification",
      recipient: recipient._id,
    });
    createdNotificationIds.push(notification._id);

    const attemptByOtherUser = await markNotificationRead(notification._id.toString(), otherUser._id.toString());
    expect(attemptByOtherUser).toBeNull();

    const stillUnread = await Notification.findById(notification._id);
    expect(stillUnread.read).toBe(false);

    const attemptByOwner = await markNotificationRead(notification._id.toString(), recipient._id.toString());
    expect(attemptByOwner).not.toBeNull();
    expect(attemptByOwner.read).toBe(true);
  });

  it("listNotificationsForUser never returns another user's notifications", async () => {
    const { user: userA } = await createTestUser();
    createdUserIds.push(userA._id);
    const { user: userB } = await createTestUser();
    createdUserIds.push(userB._id);

    const notifA = await createNotification({ type: "mention", message: "For A", recipient: userA._id });
    createdNotificationIds.push(notifA._id);
    const notifB = await createNotification({ type: "mention", message: "For B", recipient: userB._id });
    createdNotificationIds.push(notifB._id);

    const { notifications } = await listNotificationsForUser(userA._id.toString());
    expect(notifications.some((n) => n._id.toString() === notifB._id.toString())).toBe(false);
    expect(notifications.every((n) => n.recipient.toString() === userA._id.toString())).toBe(true);
  });
});

describe("message internal-note isolation", () => {
  it("internal notes are stored with type internal_note and never trigger a customer-facing reply", async () => {
    const team = await createTestTeam();
    createdTeamIds.push(team._id);
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);

    const ticket = await createTicket({
      subject: "Isolation test ticket",
      customer: customer._id.toString(),
      team: team._id.toString(),
      priority: "medium",
      channel: "email",
    });
    createdTicketIds.push(ticket._id);

    const note = await createMessage({
      ticketId: ticket._id.toString(),
      authorId: agent._id,
      authorModel: "User",
      body: "internal-only note",
      isInternal: true,
    });
    expect(note.type).toBe("internal_note");

    const messages = await listMessagesForTicket(ticket._id.toString());
    expect(messages).toHaveLength(1);
    expect(messages[0].isInternal ?? messages[0].type === "internal_note").toBeTruthy();
  });
});
