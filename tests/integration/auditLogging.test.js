import { describe, it, expect, afterAll } from "vitest";
import User from "@/server/models/User";
import Customer from "@/server/models/Customer";
import AuditLog from "@/server/models/AuditLog";
import { updateOwnProfile, updateOwnAvatar, changeOwnPassword } from "@/server/services/userService";
import {
  updateOwnProfile as updateOwnCustomerProfile,
  updateOwnAvatar as updateOwnCustomerAvatar,
  changeOwnPassword as changeOwnCustomerPassword,
} from "@/server/services/customerAuthService";
import { createTestUser, createTestCustomer } from "../helpers/factories";

const createdUserIds = [];
const createdCustomerIds = [];

afterAll(async () => {
  await AuditLog.deleteMany({ actor: { $in: [...createdUserIds, ...createdCustomerIds] } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
});

async function latestAuditEntryFor(entityId) {
  return AuditLog.findOne({ entityId: String(entityId) }).sort({ createdAt: -1 });
}

describe("audit logging — staff self-service", () => {
  it("updateOwnProfile records a user.profile_update entry with the changed fields", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    await updateOwnProfile(user._id.toString(), { name: "Audited Name", title: "Audited Title" });

    const entry = await latestAuditEntryFor(user._id);
    expect(entry).not.toBeNull();
    expect(entry.action).toBe("user.profile_update");
    expect(entry.entityType).toBe("User");
    expect(entry.actorModel).toBe("User");
    expect(entry.actorEmail).toBe(user.email);
    expect(entry.metadata).toMatchObject({ name: "Audited Name", title: "Audited Title" });
  });

  it("updateOwnAvatar records a user.avatar_update entry", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    await updateOwnAvatar(user._id.toString(), "https://res.cloudinary.com/demo/image/upload/a.png");

    const entry = await latestAuditEntryFor(user._id);
    expect(entry.action).toBe("user.avatar_update");
    expect(entry.actorModel).toBe("User");
  });

  it("changeOwnPassword records a user.password_change entry with no password content in metadata", async () => {
    const { user, password } = await createTestUser();
    createdUserIds.push(user._id);

    await changeOwnPassword(user._id.toString(), password, "BrandNewAuditPass123!", "some-session-token");

    const entry = await latestAuditEntryFor(user._id);
    expect(entry.action).toBe("user.password_change");
    expect(JSON.stringify(entry.metadata ?? {})).not.toMatch(/BrandNewAuditPass123!|password/i);
  });

  it("a failed password change (wrong current password) does not create an audit entry", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    await expect(changeOwnPassword(user._id.toString(), "wrong", "BrandNewAuditPass123!", "token")).rejects.toMatchObject({
      status: 400,
    });

    const entry = await latestAuditEntryFor(user._id);
    expect(entry).toBeNull();
  });
});

describe("audit logging — customer self-service", () => {
  it("updateOwnProfile records a customer.profile_update entry with actorModel Customer", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);

    await updateOwnCustomerProfile(customer._id.toString(), { name: "Audited Customer", phone: "555-0100", company: "Audit Co" });

    const entry = await latestAuditEntryFor(customer._id);
    expect(entry).not.toBeNull();
    expect(entry.action).toBe("customer.profile_update");
    expect(entry.entityType).toBe("Customer");
    expect(entry.actorModel).toBe("Customer");
    expect(entry.actorEmail).toBe(customer.email);
    expect(entry.metadata).toMatchObject({ name: "Audited Customer" });
  });

  it("updateOwnAvatar records a customer.avatar_update entry", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);

    await updateOwnCustomerAvatar(customer._id.toString(), "https://res.cloudinary.com/demo/image/upload/a.png");

    const entry = await latestAuditEntryFor(customer._id);
    expect(entry.action).toBe("customer.avatar_update");
    expect(entry.actorModel).toBe("Customer");
  });

  it("changeOwnPassword records a customer.password_change entry with no password content in metadata", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);
    const bcrypt = (await import("bcryptjs")).default;
    await Customer.updateOne({ _id: customer._id }, { $set: { passwordHash: await bcrypt.hash("RealAuditPass123!", 4) } });

    await changeOwnCustomerPassword(customer._id.toString(), "RealAuditPass123!", "BrandNewAuditPass123!", "token");

    const entry = await latestAuditEntryFor(customer._id);
    expect(entry.action).toBe("customer.password_change");
    expect(entry.actorModel).toBe("Customer");
    expect(JSON.stringify(entry.metadata ?? {})).not.toMatch(/BrandNewAuditPass123!|RealAuditPass123!/);
  });
});
