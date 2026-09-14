"use client";

/**
 * Thin client for the /api/realtime SSE endpoint (see app/api/realtime).
 * Shares a single EventSource per browser tab across every subscriber
 * (e.g. the notification bell and the ticket workspace both want live
 * updates at once) via a module-level, reference-counted singleton, closing
 * the connection once the last subscriber unmounts.
 *
 * Reconnection is handled natively by EventSource itself (the browser
 * automatically retries with backoff on a dropped connection) — listeners
 * are attached to the long-lived EventSource instance, so they keep working
 * across its automatic reconnects without any extra code here.
 */

const state = { source: null, refCount: 0 };

function getSource() {
  if (!state.source) {
    state.source = new EventSource("/api/realtime");
  }
  return state.source;
}

/**
 * Subscribes to one named realtime event and returns an unsubscribe
 * function. `handler` receives the already-JSON-parsed event payload.
 */
export function subscribeRealtime(eventName, handler) {
  const source = getSource();
  state.refCount += 1;

  function listener(event) {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    handler(data);
  }

  source.addEventListener(eventName, listener);

  return function unsubscribe() {
    source.removeEventListener(eventName, listener);
    state.refCount = Math.max(0, state.refCount - 1);
    if (state.refCount === 0 && state.source) {
      state.source.close();
      state.source = null;
    }
  };
}
