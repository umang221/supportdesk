import { describe, it, expect, afterAll } from "vitest";
import Customer from "@/server/models/Customer";
import {
  registerCustomer,
  verifyCustomerCredentials,
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/server/services/customerAuthService";

const createdCustomerIds = [];

afterAll(async () => {
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
});

function uniqueEmail() {
  return `test-customer-auth-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

describe("customerAuthService", () => {
  it("registers a customer and immediately verifies with the chosen password", async () => {
    const email = uniqueEmail();
    const customer = await registerCustomer({ name: "Ada Lovelace", email, password: "GoodPass123!" });
    createdCustomerIds.push(customer.id);

    const verified = await verifyCustomerCredentials(email, "GoodPass123!");
    expect(verified?.email).toBe(email);
  });

  it("rejects registering the same already-registered email twice", async () => {
    const email = uniqueEmail();
    const customer = await registerCustomer({ name: "Grace Hopper", email, password: "GoodPass123!" });
    createdCustomerIds.push(customer.id);

    await expect(registerCustomer({ name: "Grace Hopper", email, password: "OtherPass123!" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("lets registration attach a password to a pre-existing (passwordless) customer record", async () => {
    const email = uniqueEmail();
    const existing = await Customer.create({ name: "Legacy Customer", email });
    createdCustomerIds.push(existing._id);

    const registered = await registerCustomer({ name: "Legacy Customer", email, password: "GoodPass123!" });
    expect(registered.id).toBe(existing._id.toString());

    const verified = await verifyCustomerCredentials(email, "GoodPass123!");
    expect(verified).not.toBeNull();
  });

  it("verifyCustomerCredentials fails for a customer with no password set", async () => {
    const email = uniqueEmail();
    const passwordless = await Customer.create({ name: "No Password", email });
    createdCustomerIds.push(passwordless._id);

    const result = await verifyCustomerCredentials(email, "anything");
    expect(result).toBeNull();
  });

  it("password reset: old password stops working, new one works, and the token is single-use", async () => {
    const email = uniqueEmail();
    const customer = await registerCustomer({ name: "Reset Me", email, password: "OldPass123!" });
    createdCustomerIds.push(customer.id);

    await requestPasswordReset(email);
    const stored = await Customer.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    expect(stored.passwordResetTokenHash).toBeTruthy();

    // requestPasswordReset only emails the raw token (never persisted) — for
    // this test we exercise resetPasswordWithToken against a token we mint
    // ourselves and store the hash for directly, proving the token-hash
    // comparison round-trips correctly end to end.
    const { generateToken } = await import("@/server/utils/token");
    const { token, tokenHash } = generateToken();
    stored.passwordResetTokenHash = tokenHash;
    stored.passwordResetExpiresAt = new Date(Date.now() + 60_000);
    await stored.save();

    await resetPasswordWithToken(token, "NewPass123!");

    expect(await verifyCustomerCredentials(email, "OldPass123!")).toBeNull();
    expect(await verifyCustomerCredentials(email, "NewPass123!")).not.toBeNull();

    await expect(resetPasswordWithToken(token, "AnotherPass123!")).rejects.toMatchObject({ status: 400 });
  });

  it("requestPasswordReset is a silent no-op for an email with no account (no user enumeration)", async () => {
    await expect(requestPasswordReset("no-such-customer@example.test")).resolves.toBeUndefined();
  });
});
