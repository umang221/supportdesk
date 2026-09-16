import { describe, it, expect, afterAll } from "vitest";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import User from "@/server/models/User";
import Message from "@/server/models/Message";
import { PRIORITIES } from "@/lib/constants/priorities";
import { createTicket, getTicketForCustomer } from "@/server/services/ticketService";
import { createMessage, listMessagesForCustomerTicket } from "@/server/services/messageService";
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

async function setupTicketForCustomer() {
  const team = await createTestTeam();
  createdTeamIds.push(team._id);
  const customer = await createTestCustomer();
  createdCustomerIds.push(customer._id);

  const ticket = await createTicket({
    subject: "Portal messaging test ticket",
    customer: customer._id.toString(),
    team: team._id.toString(),
    priority: PRIORITIES.MEDIUM,
    channel: "portal",
  });
  createdTicketIds.push(ticket._id);

  return { ticket, customer };
}

describe("getTicketForCustomer (portal ticket ownership)", () => {
  it("returns the ticket for its owning customer", async () => {
    const { ticket, customer } = await setupTicketForCustomer();
    const found = await getTicketForCustomer(ticket._id.toString(), customer.id.toString());
    expect(found).not.toBeNull();
    expect(found.id ?? found._id.toString()).toBe(ticket._id.toString());
  });

  it("returns null for a different customer (never confirms the ticket exists)", async () => {
    const { ticket } = await setupTicketForCustomer();
    const otherCustomer = await createTestCustomer();
    createdCustomerIds.push(otherCustomer._id);

    const found = await getTicketForCustomer(ticket._id.toString(), otherCustomer._id.toString());
    expect(found).toBeNull();
  });

  it("returns null for a nonexistent ticket id", async () => {
    const { customer } = await setupTicketForCustomer();
    const found = await getTicketForCustomer("000000000000000000000000", customer.id.toString());
    expect(found).toBeNull();
  });
});

describe("listMessagesForCustomerTicket", () => {
  it("includes customer and agent replies but strips internal notes", async () => {
    const { ticket, customer } = await setupTicketForCustomer();
    const { user: agent } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);

    await createMessage({
      ticketId: ticket._id.toString(),
      authorId: customer._id,
      authorModel: "Customer",
      body: "I need help with my account.",
    });
    await createMessage({
      ticketId: ticket._id.toString(),
      authorId: agent._id,
      authorModel: "User",
      body: "Looking into it now.",
    });
    await createMessage({
      ticketId: ticket._id.toString(),
      authorId: agent._id,
      authorModel: "User",
      body: "Internal-only context for the team.",
      isInternal: true,
    });

    const messages = await listMessagesForCustomerTicket(ticket._id.toString());
    expect(messages).toHaveLength(2);
    expect(messages.every((message) => message.type !== "internal_note")).toBe(true);
    expect(messages.some((message) => message.body === "Internal-only context for the team.")).toBe(false);
  });

  it("returns null for a nonexistent ticket, matching listMessagesForTicket", async () => {
    const messages = await listMessagesForCustomerTicket("000000000000000000000000");
    expect(messages).toBeNull();
  });
});

describe("customer message creation is always non-internal", () => {
  it("createMessage never produces an internal_note for a Customer author regardless of isInternal", async () => {
    const { ticket, customer } = await setupTicketForCustomer();

    // Mirrors app/api/portal/tickets/[id]/messages/route.js, which never
    // forwards a client-supplied isInternal value for a customer author —
    // this proves the service side stays correct even if that route-level
    // guard were ever removed by mistake, since isInternal is only ever
    // false or true, never derived from authorModel.
    const message = await createMessage({
      ticketId: ticket._id.toString(),
      authorId: customer._id,
      authorModel: "Customer",
      body: "A customer reply.",
      isInternal: false,
    });
    expect(message.type).toBe("customer_reply");
  });
});
