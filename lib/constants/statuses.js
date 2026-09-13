export const STATUSES = {
  OPEN: "open",
  PENDING: "pending",
  ON_HOLD: "on_hold",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

// badgeVariant references components/ui/Badge.jsx variants.
export const STATUS_LIST = [
  { value: STATUSES.OPEN, label: "Open", badgeVariant: "neutral" },
  { value: STATUSES.PENDING, label: "Pending", badgeVariant: "muted" },
  { value: STATUSES.ON_HOLD, label: "On Hold", badgeVariant: "muted" },
  { value: STATUSES.RESOLVED, label: "Resolved", badgeVariant: "healthy" },
  { value: STATUSES.CLOSED, label: "Closed", badgeVariant: "neutral" },
];
