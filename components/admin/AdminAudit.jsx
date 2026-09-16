"use client";

import { useState } from "react";
import { Badge, Button, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { fetchAuditLog } from "@/lib/api/admin";
import { normalizeAuditEntry } from "@/lib/api/admin-adapter";
import { formatDateTime } from "@/lib/utils/format-datetime";

/**
 * Append-only admin action log (actor, action, entity, timestamp, metadata)
 * — backed by /api/admin/audit. Read-only by design; there is nothing here
 * to edit. `initialEntries`/`initialTotalPages` only seed local state on
 * mount; app/admin/audit/page.js remounts this component (via a `key` tied
 * to the request) on every real navigation, including browser back/forward
 * — see the identical note in AdminAgents.jsx.
 */
export function AdminAudit({ initialEntries, initialTotalPages }) {
  const [entries, setEntries] = useState(initialEntries);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);

  async function goToPage(nextPage) {
    setIsLoading(true);
    try {
      const result = await fetchAuditLog({ page: nextPage });
      setEntries(result.entries.map(normalizeAuditEntry));
      setPage(result.page);
      setTotalPages(result.totalPages);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Audit Log</h1>
        <p className="text-body-sm text-text-tertiary">Every sensitive admin action: who, what, and when.</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-space-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No audit entries yet</p>
          <p className="text-body-sm text-text-tertiary">Admin actions like role changes and SLA policy edits will show up here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <TableHeaderCell>When</TableHeaderCell>
                <TableHeaderCell>Actor</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Entity</TableHeaderCell>
                <TableHeaderCell>Details</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-text-secondary">{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>
                    <p className="text-body-sm text-text-primary">{entry.actorName}</p>
                    <p className="text-label-sm text-text-tertiary">{entry.actorEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{entry.action}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-text-secondary">
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-label-sm text-text-tertiary" title={JSON.stringify(entry.metadata)}>
                    {JSON.stringify(entry.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="compact" disabled={isLoading || page <= 1} onClick={() => goToPage(page - 1)}>
            Previous
          </Button>
          <span className="text-label-sm text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="compact" disabled={isLoading || page >= totalPages} onClick={() => goToPage(page + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
