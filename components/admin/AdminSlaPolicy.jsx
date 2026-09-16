"use client";

import { useState } from "react";
import { Badge, Button, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { updateSlaPolicy } from "@/lib/api/admin";

function PolicyRow({ policy, onSaved }) {
  const priorityMeta = PRIORITY_LIST.find((item) => item.value === policy.priority);
  const [firstResponseMinutes, setFirstResponseMinutes] = useState(policy.firstResponseMinutes);
  const [resolutionMinutes, setResolutionMinutes] = useState(policy.resolutionMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const { policy: updated } = await updateSlaPolicy({
        priority: policy.priority,
        firstResponseMinutes: Number(firstResponseMinutes),
        resolutionMinutes: Number(resolutionMinutes),
      });
      onSaved(updated);
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors)[0] : err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TableRow>
      <TableCell>
        <Badge variant={priorityMeta?.badgeVariant ?? "neutral"}>{priorityMeta?.label ?? policy.priority}</Badge>
      </TableCell>
      <TableCell>
        <input
          type="number"
          min={1}
          value={firstResponseMinutes}
          onChange={(event) => setFirstResponseMinutes(event.target.value)}
          className="h-8 w-24 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </TableCell>
      <TableCell>
        <input
          type="number"
          min={1}
          value={resolutionMinutes}
          onChange={(event) => setResolutionMinutes(event.target.value)}
          className="h-8 w-24 rounded-md border border-border-subtle bg-surface-card px-2 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </TableCell>
      <TableCell>{policy.isCustom ? <Badge variant="neutral">Custom</Badge> : <Badge variant="muted">Default</Badge>}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button size="compact" variant="secondary" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
          {error ? <span className="text-label-sm text-sla-critical-text">{error}</span> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * SLA policy (first-response / resolution windows) per priority — backed
 * by /api/admin/sla-policy. Edits apply to the running process immediately
 * (see lib/constants/sla-policy.js). `initialPolicies` only seeds local
 * state on mount; app/admin/sla-policy/page.js remounts this component
 * (via a `key` tied to the request) on every real navigation, including
 * browser back/forward — see the identical note in AdminAgents.jsx. Each
 * PolicyRow is additionally keyed by its own values (not just its
 * priority, which never changes) so a successful save — which replaces
 * that row's policy object one level up — remounts it with the freshly
 * saved values too, rather than leaving its inputs holding what was typed.
 */
export function AdminSlaPolicy({ policies: initialPolicies }) {
  const [policies, setPolicies] = useState(initialPolicies);

  function handleSaved(updated) {
    setPolicies((current) => current.map((policy) => (policy.priority === updated.priority ? updated : policy)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">SLA Policy</h1>
        <p className="text-body-sm text-text-tertiary">
          First-response and resolution time windows (minutes) by priority. Changes apply to new SLA calculations immediately.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>First response (min)</TableHeaderCell>
              <TableHeaderCell>Resolution (min)</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell></TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <PolicyRow
                key={`${policy.priority}:${policy.firstResponseMinutes}:${policy.resolutionMinutes}`}
                policy={policy}
                onSaved={handleSaved}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
