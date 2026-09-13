/**
 * Absolute date/time for tooltips and metadata panels, e.g. "Sep 13, 2026,
 * 7:15 AM UTC". Locale and timeZone are pinned explicitly (not left to the
 * runtime default) so this renders identically on the server and the client
 * — see the note in format-relative-time.js for why an environment-dependent
 * locale/timeZone is a hydration hazard.
 */
export function formatDateTime(isoString) {
  const formatted = new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${formatted} UTC`;
}

/** Absolute date only, e.g. "Sep 13, 2026". Same determinism guarantees as formatDateTime. */
export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
