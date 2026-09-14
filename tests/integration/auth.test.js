import { describe, it, expect, afterAll } from "vitest";
import User from "@/server/models/User";
import { verifyCredentials, createSession, getSessionUser, deleteSession } from "@/server/services/authService";
import { createTestUser } from "../helpers/factories";

const createdUserIds = [];

afterAll(async () => {
  await User.deleteMany({ _id: { $in: createdUserIds } });
});

describe("authService", () => {
  it("verifyCredentials succeeds with the correct password and returns no password hash", async () => {
    const { user, password } = await createTestUser();
    createdUserIds.push(user._id);

    const result = await verifyCredentials(user.email, password);
    expect(result).not.toBeNull();
    expect(result.email).toBe(user.email);
    expect(result.passwordHash).toBeUndefined();
  });

  it("verifyCredentials fails with the wrong password", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    const result = await verifyCredentials(user.email, "wrong-password");
    expect(result).toBeNull();
  });

  it("verifyCredentials fails for a nonexistent email", async () => {
    const result = await verifyCredentials("no-such-user@example.test", "whatever");
    expect(result).toBeNull();
  });

  it("verifyCredentials fails for a deactivated account, even with the correct password", async () => {
    const { user, password } = await createTestUser({ isActive: false });
    createdUserIds.push(user._id);

    const result = await verifyCredentials(user.email, password);
    expect(result).toBeNull();
  });

  it("session lifecycle: a created session resolves to its user, and a deleted session resolves to null", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    const { token } = await createSession(user._id);
    const sessionUser = await getSessionUser(token);
    expect(sessionUser?.email).toBe(user.email);

    await deleteSession(token);
    const afterDelete = await getSessionUser(token);
    expect(afterDelete).toBeNull();
  });

  it("getSessionUser returns null for an unknown token", async () => {
    const result = await getSessionUser("not-a-real-token");
    expect(result).toBeNull();
  });
});
