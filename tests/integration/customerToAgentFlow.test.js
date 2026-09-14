import { describe, it, expect, afterAll } from "vitest";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import User from "@/server/models/User";
import Message from "@/server/models/Message";
import { PRIORITIES } from "@/lib/constants/priorities";
import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";
import { createTicket, transitionTicketStatus, getTicketById } from "@/server/services/ticketService";
import { createMessage } from "@/server/services/messageService";
import { createTestTeam, createTestCustomer, createTestUser } from "../helpers/factories";

const createdTicketIds = [];
const createdTeamIds = [];
const createdCustomerIds = [];
const createdUserIds = [];

afterAll(async () => {
  await Message.deleteMany({ ticket: { $in: createdTicketIds } });
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

/**
 * The one flow every other feature in this app hangs off of: a ticket comes
 * in, a customer message exists, an agent replies, and the ticket is
 * resolved. This test walks that path end to end through the real services
 * (not mocks) and checks the side effects that matter: firstRespondedAt is
 * stamped on the agent's first reply (analyticsService's first-response
 * metric depends on this), and resolving completes the SLA clock and stamps
 * resolvedAt (analyticsService's resolution-time metric depends on this).
 */
describe("customer -> agent reply -> resolve flow", () => {
  it("carries a ticket from creation through a customer message, an agent reply, and resolution", async () => {
    const team = await createTestTeam();
    createdTeamIds.push(team._id);
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);

    const ticket = await createTicket({
      subject: "Cannot log in",
      customer: customer._id.toString(),
      team: team._id.toString(),
      priority: PRIORITIES.HIGH,
      channel: "email",
    });
    createdTicketIds.push(ticket._id);
    expect(ticket.status).toBe(STATUSES.OPEN);
    expect(ticket.firstRespondedAt ?? null).toBeNull();

    // Customer's initial message (authorModel Customer — supported at the
    // service layer even though no route exposes it yet; see
    // messageService.createMessage's doc comment).
    const customerMessage = await createMessage({
      ticketId: ticket._id.toString(),
      authorId: customer._id,
      authorModel: "Customer",
      body: "I can't log into my account since this morning.",
    });
    expect(customerMessage.type).toBe("customer_reply");

    let current = await getTicketById(ticket._id.toString());
    expect(current.firstRespondedAt ?? null).toBeNull(); // a customer message is not a "first response"

    // Agent replies — this is the event that stamps firstRespondedAt.
    const agentMessage = await createMessage({
      ticketId: ticket._id.toString(),
      authorId: agent._id,
      authorModel: "User",
      body: "Thanks for reaching out — resetting your password now.",
    });
    expect(agentMessage.type).toBe("agent_reply");

    current = await getTicketById(ticket._id.toString());
    expect(current.firstRespondedAt).toBeTruthy();
    const firstRespondedAt = current.firstRespondedAt;

    // A second agent reply must not move firstRespondedAt (it's "first", not "latest").
    await createMessage({
      ticketId: ticket._id.toString(),
      authorId: agent._id,
      authorModel: "User",
      body: "Following up — let me know if that worked.",
    });
    current = await getTicketById(ticket._id.toString());
    expect(new Date(current.firstRespondedAt).getTime()).toBe(new Date(firstRespondedAt).getTime());

    // Resolve — stamps resolvedAt and completes the SLA clock (still within
    // the high-priority 8h window in a test run).
    const resolved = await transitionTicketStatus(ticket._id.toString(), STATUSES.RESOLVED);
    expect(resolved.status).toBe(STATUSES.RESOLVED);
    expect(resolved.resolvedAt).toBeTruthy();
    expect(resolved.slaState).toBe(SLA_STATES.COMPLETED);
  });
});
