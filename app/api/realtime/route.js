import { getCurrentUser } from "@/lib/auth/session";
import { subscribe, REALTIME_EVENTS } from "@/server/realtime/eventBus";

// Long-lived streaming response — never prerender/cache it.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Server-Sent Events stream of realtime updates for the current session.
 *
 * Authorization mirrors the REST APIs it supplements, not a stricter model:
 * - Ticket updates: any authenticated agent/team_lead/admin may already
 *   fetch any ticket via GET /api/tickets, so broadcasting ticket:updated
 *   to every authenticated connection introduces no new exposure.
 * - Notifications are private per-recipient, so each connection filters
 *   notification:created events to its own session user before ever
 *   writing them to the stream — another user's notification content is
 *   never sent down this connection.
 * - Messages (replies/internal notes) follow the same rule as tickets: any
 *   authenticated agent/team_lead/admin can already read any ticket's full
 *   message thread (there's no team-scoping on ticket visibility anywhere
 *   in this app yet), so broadcasting message:created to every authenticated
 *   connection matches, not loosens, that existing boundary. Customers have
 *   no session that can reach this endpoint at all.
 */
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Authentication required.", { status: 401 });
  }

  let unsubscribeTicket;
  let unsubscribeNotification;
  let unsubscribeMessage;
  let heartbeat;

  function cleanup() {
    unsubscribeTicket?.();
    unsubscribeNotification?.();
    unsubscribeMessage?.();
    if (heartbeat) clearInterval(heartbeat);
  }

  const stream = new ReadableStream({
    start(controller) {
      function send(event, data) {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Connection already closed from the client side; cancel()/abort
          // below will run cleanup, nothing more to do here.
        }
      }

      unsubscribeTicket = subscribe(REALTIME_EVENTS.TICKET_UPDATED, (ticket) => {
        send("ticket:updated", ticket);
      });

      unsubscribeNotification = subscribe(REALTIME_EVENTS.NOTIFICATION_CREATED, (notification) => {
        if (String(notification.recipient) === String(user.id)) {
          send("notification:created", notification);
        }
      });

      unsubscribeMessage = subscribe(REALTIME_EVENTS.MESSAGE_CREATED, (message) => {
        send("message:created", message);
      });

      // Keeps intermediary proxies/load balancers from timing out an idle
      // connection, and lets the browser detect a dead connection sooner.
      heartbeat = setInterval(() => send("ping", { now: Date.now() }), HEARTBEAT_INTERVAL_MS);

      send("connected", { now: Date.now() });
    },
    cancel() {
      cleanup();
    },
  });

  request.signal.addEventListener("abort", cleanup);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
