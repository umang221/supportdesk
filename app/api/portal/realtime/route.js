import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { getTicketForCustomer } from "@/server/services/ticketService";
import { subscribe, REALTIME_EVENTS } from "@/server/realtime/eventBus";

// Long-lived streaming response — never prerender/cache it.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const HEARTBEAT_INTERVAL_MS = 25_000;

/** True when a ticket:updated payload is for the ticket this connection is scoped to. */
export function matchesScopedTicket(ticketId, ticket) {
  return Boolean(ticket) && String(ticket._id ?? ticket.id) === String(ticketId);
}

/**
 * True when a message:created payload should be forwarded to this
 * connection: same ticket, and never an internal note — internal notes are
 * agent-only and must never reach a customer, mirroring the server-side
 * filter messageService.listMessagesForCustomerTicket already applies to
 * the REST message list.
 */
export function shouldForwardMessage(ticketId, message) {
  return Boolean(message) && String(message.ticketId) === String(ticketId) && message.type !== "internal_note";
}

/**
 * Customer-facing counterpart to app/api/realtime/route.js, scoped to a
 * single, ownership-verified ticket rather than broadcasting every event to
 * every connection the way the staff route safely can. The staff route's
 * "broadcast is safe" reasoning relies on any authenticated staff member
 * already being able to read any ticket via REST — that exemption does not
 * hold for customers, so this connection is scoped to exactly one ticket
 * (verified once at connect time via getTicketForCustomer, the same
 * ownership check every other portal route uses — mapped to 404, never
 * 403, matching existing portal behavior), and every event afterward is
 * filtered to that ticket. This means the filter never needs to know a
 * message's owner to stay safe — it only has to match a ticket id already
 * known to belong to this customer.
 */
export async function GET(request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return new Response("Authentication required.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");
  const ticket = ticketId ? await getTicketForCustomer(ticketId, customer.id) : null;
  if (!ticket) {
    return new Response("Ticket not found.", { status: 404 });
  }

  let unsubscribeTicket;
  let unsubscribeMessage;
  let heartbeat;

  function cleanup() {
    unsubscribeTicket?.();
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

      unsubscribeTicket = subscribe(REALTIME_EVENTS.TICKET_UPDATED, (updatedTicket) => {
        if (matchesScopedTicket(ticketId, updatedTicket)) send("ticket:updated", updatedTicket);
      });

      unsubscribeMessage = subscribe(REALTIME_EVENTS.MESSAGE_CREATED, (message) => {
        if (shouldForwardMessage(ticketId, message)) send("message:created", message);
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
