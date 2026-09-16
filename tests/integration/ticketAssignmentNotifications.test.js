import { describe, it, expect, vi, afterEach, afterAll } from "vitest";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import User from "@/server/models/User";
import Notification from "@/server/models/Notification";
import { PRIORITIES } from "@/lib/constants/priorities";
import { assignTicket, createTicket } from "@/server/services/ticketService";
import { createTestTeam, createTestCustomer, createTestUser } from "../helpers/factories";
import * as emailProvider from "@/server/email/emailProvider";

const createdTicketIds = [];
const createdTeamIds = [];
const createdCustomerIds = [];
const createdUserIds = [];

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await Notification.deleteMany({ relatedTicket: { $in: createdTicketIds } });
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

async function setupTicket() {
  const team = await createTestTeam();
  createdTeamIds.push(team._id);
  const customer = await createTestCustomer();
  createdCustomerIds.push(customer._id);

  const ticket = await createTicket({
    subject: "Needs help with billing",
    customer: customer._id.toString(),
    team: team._id.toString(),
    priority: PRIORITIES.MEDIUM,
    channel: "email",
  });
  createdTicketIds.push(ticket._id);
  return ticket;
}

async function setupAgent() {
  const { user } = await createTestUser({ role: "agent" });
  createdUserIds.push(user._id);
  return user;
}

async function setupTeamLead() {
  const { user } = await createTestUser({ role: "team_lead" });
  createdUserIds.push(user._id);
  return user;
}

describe("assignTicket — assignment email", () => {
  it("sends an assignment email to the newly assigned agent", async () => {
    const sendMailSpy = vi.spyOn(emailProvider, "sendEmail");
    const ticket = await setupTicket();
    const agent = await setupAgent();
    const teamLead = await setupTeamLead();

    await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: agent.email,
        subject: expect.stringContaining(ticket.ticketNumber),
      })
    );
  });

  it("does not fail the assignment when the email send throws", async () => {
    vi.spyOn(emailProvider, "sendEmail").mockRejectedValue(new Error("SMTP is down"));
    const ticket = await setupTicket();
    const agent = await setupAgent();
    const teamLead = await setupTeamLead();

    const updated = await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    expect(updated.assignee._id.toString()).toBe(agent._id.toString());
  });
});

describe("assignTicket — in-app notification", () => {
  it("creates a ticket_assigned notification for the newly assigned agent", async () => {
    const ticket = await setupTicket();
    const agent = await setupAgent();
    const teamLead = await setupTeamLead();

    await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    const notifications = await Notification.find({ recipient: agent._id, relatedTicket: ticket._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("ticket_assigned");
    expect(notifications[0].message).toContain(ticket.ticketNumber);
  });

  it("does not create a duplicate notification when reassigned to the same user", async () => {
    const ticket = await setupTicket();
    const agent = await setupAgent();
    const teamLead = await setupTeamLead();

    await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    // Re-assigning the same ticket to the same agent (e.g. a redundant PATCH)
    // must not create a second notification.
    await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    const notifications = await Notification.find({ recipient: agent._id, relatedTicket: ticket._id });
    expect(notifications).toHaveLength(1);
  });

  it("creates a fresh notification for the new assignee on genuine reassignment", async () => {
    const ticket = await setupTicket();
    const firstAgent = await setupAgent();
    const secondAgent = await setupAgent();
    const teamLead = await setupTeamLead();

    await assignTicket(ticket._id.toString(), {
      assigneeId: firstAgent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });
    await assignTicket(ticket._id.toString(), {
      assigneeId: secondAgent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    const firstAgentNotifications = await Notification.find({ recipient: firstAgent._id, relatedTicket: ticket._id });
    const secondAgentNotifications = await Notification.find({ recipient: secondAgent._id, relatedTicket: ticket._id });
    expect(firstAgentNotifications).toHaveLength(1);
    expect(secondAgentNotifications).toHaveLength(1);
  });

  it("creates no notification when a ticket is unassigned", async () => {
    const ticket = await setupTicket();
    const agent = await setupAgent();
    const teamLead = await setupTeamLead();

    await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });
    await assignTicket(ticket._id.toString(), {
      assigneeId: null,
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });

    const notifications = await Notification.find({ relatedTicket: ticket._id });
    expect(notifications).toHaveLength(1); // only the original assignment notification
  });
});
