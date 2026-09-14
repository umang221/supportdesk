import { connectDB } from "@/server/utils/db";
import User from "@/server/models/User";

/**
 * Directory of active users an authenticated caller may assign a ticket to.
 * Only non-sensitive fields are selected — never passwordHash.
 */
export async function listAssignableUsers() {
  await connectDB();
  return User.find({ isActive: true }).select("name email role team").sort({ name: 1 });
}
