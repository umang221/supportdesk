import { requireRole } from "@/lib/auth/authorization";

export default async function AdminLayout({ children }) {
  await requireRole(["admin"]);
  return children;
}
