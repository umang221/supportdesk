import { describe, it, expect, vi, afterAll } from "vitest";
import Ticket from "@/server/models/Ticket";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";
import CustomerSession from "@/server/models/CustomerSession";
import { PRIORITIES } from "@/lib/constants/priorities";
import { createTicket } from "@/server/services/ticketService";
import { createTestTeam, createTestCustomer } from "../helpers/factories";

const createdTicketIds = [];
const createdTeamIds = [];
const createdCustomerIds = [];
const createdSessionTokens = [];

let cookieToken = null;

// The route under test calls getCurrentCustomer(), which reads next/headers'
// cookies() — this can't be given real Next.js request scope from Vitest, so
// the module is mocked to hand back whatever `cookieToken` the test sets,
// letting GET be exercised directly rather than only its dependencies.
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name) => (name === "sd_customer_session" && cookieToken ? { value: cookieToken } : undefined),
  }),
}));

const { GET, matchesScopedTicket, shouldForwardMessage } = await import("@/app/api/portal/realtime/route");
const { createCustomerSession } = await import("@/server/services/customerAuthService");

afterAll(async () => {
  await CustomerSession.deleteMany({ sessionToken: { $in: createdSessionTokens } });
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Team.deleteMany({ _id: { $in: createdTeamIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
});

async function setupCustomerWithTicket() {
  const team = await createTestTeam();
  createdTeamIds.push(team._id);
  const customer = await createTestCustomer();
  createdCustomerIds.push(customer._id);

  const ticket = await createTicket({
    subject: "Portal realtime test ticket",
    customer: customer._id.toString(),
    team: team._id.toString(),
    priority: PRIORITIES.MEDIUM,
    channel: "portal",
  });
  createdTicketIds.push(ticket._id);

  const { token } = await createCustomerSession(customer._id);
  createdSessionTokens.push(token);

  return { customer, ticket, sessionToken: token };
}

function makeRequest(ticketId) {
  const url = new URL(`http://localhost/api/portal/realtime${ticketId ? `?ticketId=${ticketId}` : ""}`);
  const controller = new AbortController();
  return {
    url: url.toString(),
    signal: controller.signal,
  };
}

describe("GET /api/portal/realtime — auth and ownership", () => {
  it("returns 401 when there is no customer session", async () => {
    cookieToken = null;
    const { ticket } = await setupCustomerWithTicket();

    const response = await GET(makeRequest(ticket._id.toString()));
    expect(response.status).toBe(401);
  });

  it("returns 404 for a nonexistent ticket id", async () => {
    const { sessionToken } = await setupCustomerWithTicket();
    cookieToken = sessionToken;

    const response = await GET(makeRequest("000000000000000000000000"));
    expect(response.status).toBe(404);
  });

  it("returns 404 when the ticket belongs to a different customer (never confirms it exists)", async () => {
    const { ticket } = await setupCustomerWithTicket();
    const { sessionToken: otherSessionToken } = await setupCustomerWithTicket();
    cookieToken = otherSessionToken;

    const response = await GET(makeRequest(ticket._id.toString()));
    expect(response.status).toBe(404);
  });

  it("returns 404 when no ticketId is provided", async () => {
    const { sessionToken } = await setupCustomerWithTicket();
    cookieToken = sessionToken;

    const response = await GET(makeRequest());
    expect(response.status).toBe(404);
  });

  it("opens a text/event-stream response for the ticket's own customer", async () => {
    const { ticket, sessionToken } = await setupCustomerWithTicket();
    cookieToken = sessionToken;

    const response = await GET(makeRequest(ticket._id.toString()));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    // The route's ReadableStream keeps a heartbeat interval alive — cancel it
    // rather than leaving it running past this test.
    await response.body.cancel();
  });
});

describe("portal realtime — ownership/internal-note filtering (pure helpers used by the route)", () => {
  it("matchesScopedTicket only matches the scoped ticket id", () => {
    const ticketA = { _id: "ticket-a" };
    const ticketB = { _id: "ticket-b" };
    expect(matchesScopedTicket("ticket-a", ticketA)).toBe(true);
    expect(matchesScopedTicket("ticket-a", ticketB)).toBe(false);
    expect(matchesScopedTicket("ticket-a", null)).toBe(false);
  });

  it("shouldForwardMessage forwards only same-ticket, non-internal messages", () => {
    const sameTicketReply = { ticketId: "ticket-a", type: "customer_reply" };
    const sameTicketInternalNote = { ticketId: "ticket-a", type: "internal_note" };
    const otherTicketReply = { ticketId: "ticket-b", type: "agent_reply" };

    expect(shouldForwardMessage("ticket-a", sameTicketReply)).toBe(true);
    expect(shouldForwardMessage("ticket-a", sameTicketInternalNote)).toBe(false);
    expect(shouldForwardMessage("ticket-a", otherTicketReply)).toBe(false);
  });
});

describe("portal realtime — security: cross-customer isolation with real event payloads", () => {
  it("never matches customer B's ticket/message events against customer A's scoped ticket id", async () => {
    const { ticket: ticketA } = await setupCustomerWithTicket();
    const { ticket: ticketB } = await setupCustomerWithTicket();

    // Real ticket:updated-shaped payload (as ticketService actually publishes it).
    const ticketBUpdatedPayload = { _id: ticketB._id.toString(), subject: ticketB.subject };
    expect(matchesScopedTicket(ticketA._id.toString(), ticketBUpdatedPayload)).toBe(false);
    expect(matchesScopedTicket(ticketA._id.toString(), { _id: ticketA._id.toString() })).toBe(true);

    // Real message:created-shaped payload (as messageService actually publishes it).
    const ticketBMessagePayload = { ticketId: ticketB._id.toString(), type: "customer_reply", body: "For B only" };
    expect(shouldForwardMessage(ticketA._id.toString(), ticketBMessagePayload)).toBe(false);
    expect(shouldForwardMessage(ticketB._id.toString(), ticketBMessagePayload)).toBe(true);
  });
});
