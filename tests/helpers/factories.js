import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/server/utils/db";
import User from "@/server/models/User";
import Team from "@/server/models/Team";
import Customer from "@/server/models/Customer";

/**
 * Test data factories for integration tests. Every id/email is suffixed
 * with a random token so repeated/parallel test runs never collide on a
 * unique index (email, team name) even if a previous run's cleanup didn't
 * fully complete — tests should still explicitly delete what they create
 * (see each test file's afterAll), this is just a second line of defense.
 */
function uniqueSuffix() {
  return crypto.randomBytes(4).toString("hex");
}

export async function createTestTeam(overrides = {}) {
  await connectDB();
  return Team.create({
    name: `Test Team ${uniqueSuffix()}`,
    description: "Created by an automated test.",
    ...overrides,
  });
}

export async function createTestCustomer(overrides = {}) {
  await connectDB();
  return Customer.create({
    name: "Test Customer",
    email: `test-customer-${uniqueSuffix()}@example.test`,
    company: "Test Co",
    ...overrides,
  });
}

export async function createTestUser({ password = "TestPass123!", role = "agent", ...overrides } = {}) {
  await connectDB();
  const passwordHash = await bcrypt.hash(password, 4); // low cost factor: tests don't need production hashing cost
  const user = await User.create({
    name: "Test User",
    email: `test-user-${uniqueSuffix()}@example.test`,
    passwordHash,
    role,
    isActive: true,
    ...overrides,
  });
  return { user, password };
}
