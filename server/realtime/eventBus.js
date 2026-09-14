import { EventEmitter } from "node:events";

/**
 * Process-local pub/sub for realtime updates (see app/api/realtime/route.js).
 * Cached on `global` for the same reason as server/utils/db.js's mongoose
 * connection: Next.js dev mode clears the module cache on every hot reload,
 * which would otherwise drop all live SSE subscriptions on each edit.
 *
 * This is intentionally in-process, not Redis/a queue — appropriate for the
 * single-Node-process deployment this app already assumes elsewhere (see
 * connectDB's cached global connection). It won't fan out across multiple
 * server instances; that would need a shared broker and is out of scope for
 * this foundation.
 */
let bus = global._realtimeBus;
if (!bus) {
  bus = global._realtimeBus = new EventEmitter();
  // Many concurrent SSE connections each add a listener per event type;
  // the default limit of 10 would otherwise log spurious warnings.
  bus.setMaxListeners(0);
}

export const REALTIME_EVENTS = {
  TICKET_UPDATED: "ticket:updated",
  NOTIFICATION_CREATED: "notification:created",
  MESSAGE_CREATED: "message:created",
};

export function publish(event, payload) {
  bus.emit(event, payload);
}

/** Returns an unsubscribe function. */
export function subscribe(event, handler) {
  bus.on(event, handler);
  return () => bus.off(event, handler);
}
