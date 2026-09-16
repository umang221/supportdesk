"use client";

/**
 * Thin client for the /api/portal/realtime SSE endpoint — the customer
 * portal's counterpart to lib/realtime/realtimeClient.js. Kept as a
 * separate module (not a generalization of the staff client) so the
 * well-tested staff client is never touched: unlike that client's single
 * connection reused for the whole app session (any staff member can already
 * see any ticket, so one shared feed makes sense there), a customer's
 * connection can only ever "see" the one ticket it was opened for (see
 * app/api/portal/realtime/route.js), so this is keyed by ticketId instead
 * of being a single app-wide singleton.
 *
 * Reconnection is handled natively by EventSource itself, same as the
 * staff client.
 */

const connections = new Map(); // ticketId -> { source, refCount }

function getConnection(ticketId) {
  let entry = connections.get(ticketId);
  if (!entry) {
    entry = { source: new EventSource(`/api/portal/realtime?ticketId=${encodeURIComponent(ticketId)}`), refCount: 0 };
    connections.set(ticketId, entry);
  }
  return entry;
}

/**
 * Subscribes to one named realtime event for the given ticket and returns
 * an unsubscribe function. `handler` receives the already-JSON-parsed event
 * payload. Multiple subscribers for the same ticketId share one connection;
 * it closes once the last one unsubscribes (e.g. on unmount, or when the
 * viewed ticket changes).
 */
export function subscribePortalRealtime(ticketId, eventName, handler) {
  const entry = getConnection(ticketId);
  entry.refCount += 1;

  function listener(event) {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    handler(data);
  }

  entry.source.addEventListener(eventName, listener);

  return function unsubscribe() {
    entry.source.removeEventListener(eventName, listener);
    entry.refCount = Math.max(0, entry.refCount - 1);
    if (entry.refCount === 0) {
      entry.source.close();
      connections.delete(ticketId);
    }
  };
}
