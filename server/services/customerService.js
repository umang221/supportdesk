import { connectDB } from "@/server/utils/db";
import Customer from "@/server/models/Customer";

/** Full customer roster for the admin customers screen. */
export async function listCustomers() {
  await connectDB();
  return Customer.find().sort({ name: 1 });
}
