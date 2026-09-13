import { requireUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }) {
  await requireUser();
  return children;
}
