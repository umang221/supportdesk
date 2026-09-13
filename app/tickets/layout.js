import { requireUser } from "@/lib/auth/session";

export default async function TicketsLayout({ children }) {
  await requireUser();
  return children;
}
