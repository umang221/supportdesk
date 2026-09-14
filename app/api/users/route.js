import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listAssignableUsers } from "@/server/services/userService";

/**
 * Read-only user directory for the ticket assignment UI (who can a ticket be
 * assigned to). Any authenticated user may read it — it exposes no
 * sensitive fields — but assignment itself is still authorized server-side
 * in ticketService.assignTicket, so this listing being broad doesn't widen
 * who can actually assign tickets to whom.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const users = await listAssignableUsers();
  return NextResponse.json({ users });
}
