import { Badge, SlaIndicator, Avatar, TableHeaderCell, TableRow, TableCell } from "@/components/ui";

/**
 * A real slice of the product's own UI (the same Badge/SlaIndicator/Avatar/
 * Table primitives the authenticated Agent Workspace renders — see
 * components/tickets/TicketRow.jsx) with static, representative sample
 * data, rather than a generic stock screenshot or an illustration. Data
 * here is fixed on purpose: this page is public and unauthenticated, so it
 * must never render real customer/ticket data.
 */
const SAMPLE_ROWS = [
  {
    id: "TCK-1042",
    subject: "Unable to export invoice history",
    customer: "Northfield Logistics",
    priority: { label: "Urgent", variant: "critical" },
    status: { label: "Open", variant: "neutral" },
    sla: { variant: "critical", label: "22m left" },
    assignee: "Priya C.",
  },
  {
    id: "TCK-1039",
    subject: "SSO login redirect loop",
    customer: "Marlowe & Finch",
    priority: { label: "High", variant: "approaching" },
    status: { label: "Pending", variant: "muted" },
    sla: { variant: "approaching", label: "1h 40m left" },
    assignee: "Elena K.",
  },
  {
    id: "TCK-1035",
    subject: "Feature request: bulk tagging",
    customer: "Acme Robotics",
    priority: { label: "Low", variant: "neutral" },
    status: { label: "Resolved", variant: "healthy" },
    sla: { variant: "healthy", label: "Within SLA" },
    assignee: "Marcus W.",
  },
];

export function ProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle bg-canvas-bg px-space-lg py-space-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-sla-critical" />
        <span className="h-2.5 w-2.5 rounded-full bg-sla-approaching" />
        <span className="h-2.5 w-2.5 rounded-full bg-sla-healthy" />
        <span className="ml-2 text-label-sm text-text-tertiary">Agent Workspace — Ticket Queue</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <TableHeaderCell>Ticket</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Assignee</TableHeaderCell>
              <TableHeaderCell>SLA</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-0">
                  <div className="truncate font-medium text-text-primary">{row.subject}</div>
                  <div className="truncate text-label-sm text-text-tertiary">
                    {row.id} · {row.customer}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={row.priority.variant}>{row.priority.label}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={row.status.variant}>{row.status.label}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Avatar name={row.assignee} size="sm" />
                    <span className="truncate text-body-sm">{row.assignee}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <SlaIndicator variant={row.sla.variant} label={row.sla.label} />
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
