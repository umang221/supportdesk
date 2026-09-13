const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Short relative timestamp for ticket/message lists, e.g. "5m ago", "3h ago",
 * "2d ago". Falls back to a short absolute date once it's more than a week
 * old, since "42d ago" stops being scannable.
 *
 * `now` must be passed in explicitly rather than defaulted to `Date.now()`:
 * a default would be evaluated separately during server rendering and again
 * during client hydration, producing different output and a hydration
 * mismatch. Callers should thread a single shared `now` value down instead
 * (see AgentWorkspace's `now` state).
 */
export function formatRelativeTime(isoString, now) {
  const then = new Date(isoString).getTime();
  const diff = now - then;

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;

  // Fixed locale/timeZone: toLocaleDateString(undefined, ...) resolves the
  // *runtime's* default locale/timeZone, which can differ between the Node
  // server and the browser and would itself be a second hydration mismatch.
  return new Date(then).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
