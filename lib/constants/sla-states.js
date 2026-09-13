// Mirrors the variants accepted by components/ui/SlaIndicator.jsx.
export const SLA_STATES = {
  HEALTHY: "healthy",
  APPROACHING: "approaching",
  CRITICAL: "critical",
  BREACHED: "breached",
  PAUSED: "paused",
  COMPLETED: "completed",
};

export const SLA_STATE_LIST = [
  { value: SLA_STATES.HEALTHY, label: "Within SLA" },
  { value: SLA_STATES.APPROACHING, label: "Approaching deadline" },
  { value: SLA_STATES.CRITICAL, label: "Critical — nearly breached" },
  { value: SLA_STATES.BREACHED, label: "SLA breached" },
  { value: SLA_STATES.PAUSED, label: "SLA paused" },
  { value: SLA_STATES.COMPLETED, label: "Completed within SLA" },
];
