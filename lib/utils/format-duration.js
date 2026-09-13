const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact duration label ("3h 21m", "1d 4h", "12m") for SLA countdowns. */
export function formatDuration(ms) {
  const abs = Math.abs(ms);

  if (abs < MINUTE) return "<1m";

  const days = Math.floor(abs / DAY);
  const hours = Math.floor((abs % DAY) / HOUR);
  const minutes = Math.floor((abs % HOUR) / MINUTE);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
