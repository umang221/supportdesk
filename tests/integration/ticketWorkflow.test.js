import { describe, it, expect, afterAll } from "vitest";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import User from "@/server/models/User";
import { PRIORITIES } from "@/lib/constants/priorities";
import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";
import { createTicket, transitionTicketStatus, assignTicket, updateTicket } from "@/server/services/ticketService";
import { createTestTeam, createTestCustomer, createTestUser } from "../helpers/factories";

const createdTicketIds = [];
const createdTeamIds = [];
const createdCustomerIds = [];
const createdUserIds = [];

afterAll(async () => {
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

async function setupTicket(priority = PRIORITIES.MEDIUM) {
  const team = await createTestTeam();
  createdTeamIds.push(team._id);
  const customer = await createTestCustomer();
  createdCustomerIds.push(customer._id);

  const ticket = await createTicket({
    subject: "Test ticket",
    customer: customer._id.toString(),
    team: team._id.toString(),
    priority,
    channel: "email",
  });
  createdTicketIds.push(ticket._id);
  return { ticket, team, customer };
}

describe("ticketService — creation and SLA", () => {
  it("creates a ticket with a generated ticket number and an initial healthy SLA state", async () => {
    const { ticket } = await setupTicket(PRIORITIES.URGENT);
    expect(ticket.ticketNumber).toMatch(/^TCK-\d+$/);
    expect(ticket.status).toBe(STATUSES.OPEN);
    expect(ticket.slaState).toBe(SLA_STATES.HEALTHY);
    expect(ticket.dueAt).toBeTruthy();
  });

  it("rejects creating a ticket against a nonexistent customer/team", async () => {
    const team = await createTestTeam();
    createdTeamIds.push(team._id);
    await expect(
      createTicket({
        subject: "Should fail",
        customer: "aaaaaaaaaaaaaaaaaaaaaaaa",
        team: team._id.toString(),
        priority: PRIORITIES.LOW,
        channel: "email",
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("ticketService — status transitions", () => {
  it("marks a ticket completed when resolved before its SLA deadline", async () => {
    const { ticket } = await setupTicket(PRIORITIES.LOW); // 72h window, won't breach in a test run
    const updated = await transitionTicketStatus(ticket._id.toString(), STATUSES.RESOLVED);
    expect(updated.status).toBe(STATUSES.RESOLVED);
    expect(updated.slaState).toBe(SLA_STATES.COMPLETED);
    expect(updated.resolvedAt).toBeTruthy();
  });

  it("rejects an illegal transition (closed straight to pending)", async () => {
    const { ticket } = await setupTicket();
    await transitionTicketStatus(ticket._id.toString(), STATUSES.CLOSED);
    await expect(transitionTicketStatus(ticket._id.toString(), STATUSES.PENDING)).rejects.toMatchObject({
      status: 409,
      code: "invalid_status_transition",
    });
  });

  it("returns null for a status transition on a nonexistent ticket", async () => {
    const result = await transitionTicketStatus("aaaaaaaaaaaaaaaaaaaaaaaa", STATUSES.RESOLVED);
    expect(result).toBeNull();
  });

  it("pauses the SLA clock on hold and resumes it on reopen", async () => {
    const { ticket } = await setupTicket(PRIORITIES.URGENT);
    const held = await transitionTicketStatus(ticket._id.toString(), STATUSES.ON_HOLD);
    expect(held.slaState).toBe(SLA_STATES.PAUSED);

    const resumed = await transitionTicketStatus(ticket._id.toString(), STATUSES.OPEN);
    expect(resumed.slaState).toBe(SLA_STATES.HEALTHY);
  });
});

describe("ticketService — assignment authorization (object-level, enforced in the service, not just the route)", () => {
  it("lets an agent self-assign", async () => {
    const { ticket } = await setupTicket();
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);

    const updated = await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: agent._id.toString(), role: "agent" },
    });
    expect(updated.assignee._id.toString()).toBe(agent._id.toString());
  });

  it("forbids an agent from assigning a ticket to someone else", async () => {
    const { ticket } = await setupTicket();
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);
    const { user: otherAgent } = await createTestUser({ role: "agent" });
    createdUserIds.push(otherAgent._id);

    await expect(
      assignTicket(ticket._id.toString(), {
        assigneeId: otherAgent._id.toString(),
        actingUser: { id: agent._id.toString(), role: "agent" },
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("forbids an agent from unassigning a ticket", async () => {
    const { ticket } = await setupTicket();
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);
    await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: agent._id.toString(), role: "agent" },
    });

    await expect(
      assignTicket(ticket._id.toString(), {
        assigneeId: null,
        actingUser: { id: agent._id.toString(), role: "agent" },
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("lets a team lead assign to anyone, and unassign", async () => {
    const { ticket } = await setupTicket();
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);
    const { user: teamLead } = await createTestUser({ role: "team_lead" });
    createdUserIds.push(teamLead._id);

    const assigned = await assignTicket(ticket._id.toString(), {
      assigneeId: agent._id.toString(),
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });
    expect(assigned.assignee._id.toString()).toBe(agent._id.toString());

    const unassigned = await assignTicket(ticket._id.toString(), {
      assigneeId: null,
      actingUser: { id: teamLead._id.toString(), role: "team_lead" },
    });
    expect(unassigned.assignee).toBeNull();
  });

  it("rejects assigning to an inactive user", async () => {
    const { ticket } = await setupTicket();
    const { user: inactiveAgent } = await createTestUser({ role: "agent", isActive: false });
    createdUserIds.push(inactiveAgent._id);
    const { user: teamLead } = await createTestUser({ role: "team_lead" });
    createdUserIds.push(teamLead._id);

    await expect(
      assignTicket(ticket._id.toString(), {
        assigneeId: inactiveAgent._id.toString(),
        actingUser: { id: teamLead._id.toString(), role: "team_lead" },
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("ticketService — priority change recalculates SLA off the original createdAt", () => {
  it("tightens the deadline without resetting the SLA clock start", async () => {
    const { ticket } = await setupTicket(PRIORITIES.LOW);
    const updated = await updateTicket(ticket._id.toString(), { priority: PRIORITIES.URGENT });
    const createdAt = new Date(updated.createdAt).getTime();
    const dueAt = new Date(updated.dueAt).getTime();
    expect(dueAt - createdAt).toBe(4 * 60 * 60 * 1000); // urgent resolution window
  });
});
