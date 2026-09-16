import { describe, it, expect } from "vitest";
import { normalizeTicket, normalizeMessage } from "@/lib/api/ticket-adapter";
import { normalizeAdminAgent, normalizeAdminCustomer } from "@/lib/api/admin-adapter";

/**
 * Task 24 threaded avatarUrl through the populate projections in
 * ticketService/messageService and through these client-facing adapters —
 * these are pure functions (no DB/network), so the safest way to prove the
 * plumbing is correct end-to-end is to feed each adapter the exact shape
 * its upstream query now produces and assert avatarUrl survives the trip.
 */
describe("ticket-adapter avatar passthrough", () => {
  it("normalizeTicket carries avatarUrl through for both customer and assignee", () => {
    const ticket = {
      _id: "t1",
      customer: { _id: "c1", name: "Grace", email: "g@example.test", company: "Acme", avatarUrl: "https://cdn/customer.png" },
      team: { _id: "team1", name: "Support" },
      assignee: { _id: "u1", name: "Alex", email: "a@example.test", avatarUrl: "https://cdn/agent.png" },
    };

    const normalized = normalizeTicket(ticket);
    expect(normalized.customer.avatarUrl).toBe("https://cdn/customer.png");
    expect(normalized.assignee.avatarUrl).toBe("https://cdn/agent.png");
  });

  it("normalizeTicket doesn't choke when a ref has no avatarUrl set", () => {
    const ticket = {
      _id: "t1",
      customer: { _id: "c1", name: "Grace", email: "g@example.test" },
      team: null,
      assignee: null,
    };

    const normalized = normalizeTicket(ticket);
    expect(normalized.customer.avatarUrl).toBeUndefined();
    expect(normalized.assignee).toBeNull();
  });

  it("normalizeMessage carries the author's avatarUrl through as authorAvatarUrl", () => {
    const message = {
      _id: "m1",
      authorModel: "Customer",
      author: { _id: "c1", name: "Grace", avatarUrl: "https://cdn/customer.png" },
      body: "Hello",
      type: "customer_reply",
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    const normalized = normalizeMessage(message);
    expect(normalized.authorAvatarUrl).toBe("https://cdn/customer.png");
    expect(normalized.authorType).toBe("customer");
  });

  it("normalizeMessage returns null authorAvatarUrl (not undefined) when the author has none", () => {
    const message = {
      _id: "m1",
      authorModel: "User",
      author: { _id: "u1", name: "Alex" },
      body: "Hi",
      type: "agent_reply",
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    const normalized = normalizeMessage(message);
    expect(normalized.authorAvatarUrl).toBeNull();
  });
});

describe("admin-adapter avatar passthrough", () => {
  it("normalizeAdminAgent carries avatarUrl through", () => {
    const agent = { _id: "u1", name: "Alex", email: "a@example.test", role: "agent", avatarUrl: "https://cdn/agent.png" };
    expect(normalizeAdminAgent(agent).avatarUrl).toBe("https://cdn/agent.png");
  });

  it("normalizeAdminAgent returns null avatarUrl when unset", () => {
    const agent = { _id: "u1", name: "Alex", email: "a@example.test", role: "agent" };
    expect(normalizeAdminAgent(agent).avatarUrl).toBeNull();
  });

  it("normalizeAdminCustomer carries avatarUrl through", () => {
    const customer = { _id: "c1", name: "Grace", email: "g@example.test", plan: "Starter", avatarUrl: "https://cdn/customer.png" };
    expect(normalizeAdminCustomer(customer).avatarUrl).toBe("https://cdn/customer.png");
  });

  it("normalizeAdminCustomer returns null avatarUrl when unset", () => {
    const customer = { _id: "c1", name: "Grace", email: "g@example.test", plan: "Starter" };
    expect(normalizeAdminCustomer(customer).avatarUrl).toBeNull();
  });
});
