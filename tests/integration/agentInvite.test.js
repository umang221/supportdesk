import { describe, it, expect, afterAll } from "vitest";
import User from "@/server/models/User";
import { createUser, resetUserPassword, setPasswordWithToken, deleteUser } from "@/server/services/userService";
import { verifyCredentials } from "@/server/services/authService";
import { generateToken } from "@/server/utils/token";
import { createTestUser } from "../helpers/factories";

const createdUserIds = [];

afterAll(async () => {
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

function uniqueEmail() {
  return `test-agent-invite-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

async function mintTokenFor(user, field = "passwordSetupTokenHash", expiresField = "passwordSetupTokenExpiresAt") {
  const { token, tokenHash } = generateToken();
  await User.updateOne({ _id: user._id }, { $set: { [field]: tokenHash, [expiresField]: new Date(Date.now() + 60_000) } });
  return token;
}

describe("agent invite / admin password reset (userService)", () => {
  it("a newly invited agent cannot log in with any password until they complete the invite", async () => {
    const { user: admin } = await createTestUser({ role: "admin" });
    createdUserIds.push(admin._id);

    const email = uniqueEmail();
    const created = await createUser({ name: "New Agent", email, role: "agent" }, admin);
    createdUserIds.push(created._id);

    // No password could possibly work — createUser never accepts one.
    expect(await verifyCredentials(email, "")).toBeNull();
    expect(await verifyCredentials(email, "guess")).toBeNull();
  });

  it("completing the invite sets a real password that then works to log in", async () => {
    const { user: admin } = await createTestUser({ role: "admin" });
    createdUserIds.push(admin._id);

    const email = uniqueEmail();
    const created = await createUser({ name: "New Agent", email, role: "agent" }, admin);
    createdUserIds.push(created._id);

    const token = await mintTokenFor(created);
    await setPasswordWithToken(token, "FreshPass123!");

    const verified = await verifyCredentials(email, "FreshPass123!");
    expect(verified?.email).toBe(email);

    // The token is cleared on use, so it can't be replayed.
    await expect(setPasswordWithToken(token, "AnotherPass123!")).rejects.toMatchObject({ status: 400 });
  });

  it("resetUserPassword immediately invalidates the old password, not just after the new link is used", async () => {
    const { user: admin } = await createTestUser({ role: "admin" });
    createdUserIds.push(admin._id);
    const { user: agent, password: oldPassword } = await createTestUser({ role: "agent" });
    createdUserIds.push(agent._id);

    // Sanity check: the old password works before the reset.
    expect(await verifyCredentials(agent.email, oldPassword)).not.toBeNull();

    await resetUserPassword(agent._id.toString(), admin);

    // The whole point of an admin-triggered reset (e.g. a suspected
    // compromise) is that the old password stops working right away.
    expect(await verifyCredentials(agent.email, oldPassword)).toBeNull();

    const token = await mintTokenFor(agent);
    await setPasswordWithToken(token, "BrandNewPass123!");
    expect(await verifyCredentials(agent.email, "BrandNewPass123!")).not.toBeNull();
  });

  it("deleteUser refuses to remove the caller's own account", async () => {
    const { user: admin } = await createTestUser({ role: "admin" });
    createdUserIds.push(admin._id);

    await expect(deleteUser(admin._id.toString(), admin)).rejects.toMatchObject({ status: 400 });
  });

  it("deleteUser removes the account so it can no longer authenticate", async () => {
    const { user: admin } = await createTestUser({ role: "admin" });
    createdUserIds.push(admin._id);
    const { user: agent, password } = await createTestUser({ role: "agent" });

    expect(await verifyCredentials(agent.email, password)).not.toBeNull();

    await deleteUser(agent._id.toString(), admin);

    expect(await verifyCredentials(agent.email, password)).toBeNull();
    expect(await User.findById(agent._id)).toBeNull();
  });
});
