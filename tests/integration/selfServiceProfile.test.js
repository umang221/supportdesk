import { describe, it, expect, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import User from "@/server/models/User";
import Session from "@/server/models/Session";
import Customer from "@/server/models/Customer";
import CustomerSession from "@/server/models/CustomerSession";
import { updateOwnProfile, updateOwnAvatar, changeOwnPassword } from "@/server/services/userService";
import {
  updateOwnProfile as updateOwnCustomerProfile,
  updateOwnAvatar as updateOwnCustomerAvatar,
  changeOwnPassword as changeOwnCustomerPassword,
} from "@/server/services/customerAuthService";
import { verifyCredentials } from "@/server/services/authService";
import { verifyCustomerCredentials } from "@/server/services/customerAuthService";
import { validateUpdateOwnProfileInput, validateChangePasswordInput } from "@/server/validators/adminValidators";
import { validateCustomerUpdateProfileInput } from "@/server/validators/customerAuthValidators";
import { assertValidAvatarFile, assertUploadsConfigured } from "@/server/attachments/avatarService";
import { createTestUser, createTestCustomer } from "../helpers/factories";

const createdUserIds = [];
const createdCustomerIds = [];

afterAll(async () => {
  await Session.deleteMany({ user: { $in: createdUserIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await CustomerSession.deleteMany({ customer: { $in: createdCustomerIds } });
  await Customer.deleteMany({ _id: { $in: createdCustomerIds } });
});

function fakeImageFile({ size = 1024, type = "image/png" } = {}) {
  return { size, type, name: "avatar.png", arrayBuffer: async () => new ArrayBuffer(size) };
}

function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

describe("validateUpdateOwnProfileInput (staff)", () => {
  it("accepts name/title", () => {
    const patch = validateUpdateOwnProfileInput({ name: "New Name", title: "Support Lead" });
    expect(patch).toEqual({ name: "New Name", title: "Support Lead" });
  });

  it("rejects role/team/isActive even when name is also present", () => {
    expect(() => validateUpdateOwnProfileInput({ name: "New Name", role: "admin" })).toThrow(/cannot be changed here/);
    expect(() => validateUpdateOwnProfileInput({ isActive: false })).toThrow(/cannot be changed here/);
    expect(() => validateUpdateOwnProfileInput({ team: "000000000000000000000000" })).toThrow(/cannot be changed here/);
  });

  it("rejects an empty name", () => {
    expect(() => validateUpdateOwnProfileInput({ name: "   " })).toThrow(/cannot be empty/);
  });
});

describe("validateCustomerUpdateProfileInput", () => {
  it("accepts name/phone/company", () => {
    const patch = validateCustomerUpdateProfileInput({ name: "New Name", phone: "555-0100", company: "Acme" });
    expect(patch).toEqual({ name: "New Name", phone: "555-0100", company: "Acme" });
  });

  it("rejects plan and email", () => {
    expect(() => validateCustomerUpdateProfileInput({ plan: "Enterprise" })).toThrow(/cannot be changed here/);
    expect(() => validateCustomerUpdateProfileInput({ email: "new@example.test" })).toThrow(/cannot be changed here/);
  });
});

describe("validateChangePasswordInput", () => {
  it("requires currentPassword and a valid newPassword", () => {
    expect(() => validateChangePasswordInput({ newPassword: "GoodPass123!" })).toThrow(/Current password is required/);
    expect(() => validateChangePasswordInput({ currentPassword: "old", newPassword: "short" })).toThrow(/at least 8 characters/);
    const result = validateChangePasswordInput({ currentPassword: "old", newPassword: "GoodPass123!" });
    expect(result).toEqual({ currentPassword: "old", newPassword: "GoodPass123!" });
  });
});

describe("userService self-service profile", () => {
  it("updateOwnProfile updates name/title and nothing else", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    const updated = await updateOwnProfile(user._id.toString(), { name: "Updated Name", title: "New Title" });
    expect(updated.name).toBe("Updated Name");
    expect(updated.title).toBe("New Title");
    expect(updated.role).toBe(user.role); // unchanged — this path never touches role
  });

  it("updateOwnAvatar persists the given URL", async () => {
    const { user } = await createTestUser();
    createdUserIds.push(user._id);

    const updated = await updateOwnAvatar(user._id.toString(), "https://res.cloudinary.com/demo/image/upload/avatar.png");
    expect(updated.avatarUrl).toBe("https://res.cloudinary.com/demo/image/upload/avatar.png");
  });
});

describe("userService.changeOwnPassword", () => {
  it("rejects an incorrect current password and leaves the password unchanged", async () => {
    const { user, password } = await createTestUser();
    createdUserIds.push(user._id);

    await expect(changeOwnPassword(user._id.toString(), "wrong-password", "BrandNewPass123!", "some-token")).rejects.toMatchObject({
      status: 400,
      fieldErrors: { currentPassword: expect.any(String) },
    });

    expect(await verifyCredentials(user.email, password)).not.toBeNull();
  });

  it("changes the password when currentPassword is correct, and invalidates other sessions but not the current one", async () => {
    const { user, password } = await createTestUser();
    createdUserIds.push(user._id);

    const currentSession = await Session.create({
      sessionToken: "current-session-token",
      user: user._id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const otherSession = await Session.create({
      sessionToken: "other-session-token",
      user: user._id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await changeOwnPassword(user._id.toString(), password, "BrandNewPass123!", currentSession.sessionToken);

    expect(await verifyCredentials(user.email, password)).toBeNull();
    expect(await verifyCredentials(user.email, "BrandNewPass123!")).not.toBeNull();

    expect(await Session.findById(currentSession._id)).not.toBeNull();
    expect(await Session.findById(otherSession._id)).toBeNull();
  });
});

describe("customerAuthService self-service profile", () => {
  it("updateOwnProfile updates name/phone/company and never touches plan", async () => {
    const customer = await createTestCustomer({ plan: "Starter" });
    createdCustomerIds.push(customer._id);

    const updated = await updateOwnCustomerProfile(customer._id.toString(), {
      name: "Updated Customer",
      phone: "555-0199",
      company: "New Co",
    });
    expect(updated.name).toBe("Updated Customer");
    expect(updated.phone).toBe("555-0199");
    expect(updated.company).toBe("New Co");
    expect(updated.plan).toBe("Starter");
  });

  it("updateOwnAvatar persists the given URL", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);

    const updated = await updateOwnCustomerAvatar(customer._id.toString(), "https://res.cloudinary.com/demo/image/upload/avatar.png");
    expect(updated.avatarUrl).toBe("https://res.cloudinary.com/demo/image/upload/avatar.png");
  });
});

describe("customerAuthService.changeOwnPassword", () => {
  it("rejects a customer with no password set yet (nothing to change)", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);

    await expect(changeOwnCustomerPassword(customer._id.toString(), "anything", "BrandNewPass123!", "token")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects an incorrect current password", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);
    const passwordHash = await bcrypt.hash("RealPass123!", 4);
    await Customer.updateOne({ _id: customer._id }, { $set: { passwordHash } });

    await expect(
      changeOwnCustomerPassword(customer._id.toString(), "wrong-password", "BrandNewPass123!", "token")
    ).rejects.toMatchObject({ status: 400, fieldErrors: { currentPassword: expect.any(String) } });

    expect(await verifyCustomerCredentials(customer.email, "RealPass123!")).not.toBeNull();
  });

  it("changes the password when currentPassword is correct, and invalidates other sessions but not the current one", async () => {
    const customer = await createTestCustomer();
    createdCustomerIds.push(customer._id);
    const passwordHash = await bcrypt.hash("RealPass123!", 4);
    await Customer.updateOne({ _id: customer._id }, { $set: { passwordHash } });

    const currentSession = await CustomerSession.create({
      sessionToken: "current-customer-session-token",
      customer: customer._id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const otherSession = await CustomerSession.create({
      sessionToken: "other-customer-session-token",
      customer: customer._id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await changeOwnCustomerPassword(customer._id.toString(), "RealPass123!", "BrandNewPass123!", currentSession.sessionToken);

    expect(await verifyCustomerCredentials(customer.email, "RealPass123!")).toBeNull();
    expect(await verifyCustomerCredentials(customer.email, "BrandNewPass123!")).not.toBeNull();

    expect(await CustomerSession.findById(currentSession._id)).not.toBeNull();
    expect(await CustomerSession.findById(otherSession._id)).toBeNull();
  });
});

describe("avatarService", () => {
  it("assertValidAvatarFile accepts a well-formed image within the size limit", () => {
    expect(() => assertValidAvatarFile(fakeImageFile())).not.toThrow();
  });

  it("assertValidAvatarFile rejects a missing file", () => {
    expect(() => assertValidAvatarFile(null)).toThrow(/A file is required|No file provided/);
  });

  it("assertValidAvatarFile rejects a non-image type (avatars are stricter than ticket attachments)", () => {
    expect(() => assertValidAvatarFile(fakeImageFile({ type: "application/pdf" }))).toThrow(/Unsupported image type/);
  });

  it("assertValidAvatarFile rejects a file over the 2MB avatar limit", () => {
    expect(() => assertValidAvatarFile(fakeImageFile({ size: 3 * 1024 * 1024 }))).toThrow(/exceeds/);
  });

  it("assertUploadsConfigured throws a 503 when Cloudinary env vars are absent (dev-safe default)", () => {
    if (cloudinaryConfigured()) return; // Skip in an environment that does have real credentials configured.
    expect(() => assertUploadsConfigured()).toThrow(/not configured/);
  });
});
