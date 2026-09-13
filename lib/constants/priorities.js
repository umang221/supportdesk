export const PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// badgeVariant references components/ui/Badge.jsx variants.
export const PRIORITY_LIST = [
  { value: PRIORITIES.LOW, label: "Low", badgeVariant: "neutral", weight: 1 },
  { value: PRIORITIES.MEDIUM, label: "Medium", badgeVariant: "neutral", weight: 2 },
  { value: PRIORITIES.HIGH, label: "High", badgeVariant: "approaching", weight: 3 },
  { value: PRIORITIES.URGENT, label: "Urgent", badgeVariant: "critical", weight: 4 },
];
