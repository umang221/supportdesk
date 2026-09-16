"use client";

import { useState } from "react";
import { Button, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { PRIORITY_LIST } from "@/lib/constants/priorities";
import { formatDate } from "@/lib/utils/format-datetime";
import { fetchAnalyticsInsights } from "@/lib/api/analytics";
import { MetricCard } from "./MetricCard";
import { BarChart } from "./BarChart";

// "No data yet" rather than a bare "—": a dash reads as a rendering glitch
// on a real metric tile, where this actually means "nothing has been
// resolved/responded to/completed long enough to compute an average yet".
function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return "No data yet";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return "No data yet";
  return `${Math.round(value)}%`;
}

/**
 * Real-data analytics dashboard. `initialSummary` is computed server-side
 * (see app/analytics/page.js) so the first paint needs no client fetch; the
 * "Generate AI Insights" button is the only thing on this screen that ever
 * calls Gemini — every chart/metric here is plain MongoDB aggregation (see
 * server/services/analyticsService.js) and works with no AI configured.
 */
export function AnalyticsDashboard({ initialSummary }) {
  const summary = initialSummary;
  const [insights, setInsights] = useState(null);
  const [insightsError, setInsightsError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateInsights() {
    setIsGenerating(true);
    setInsightsError(null);
    try {
      const result = await fetchAnalyticsInsights();
      setInsights(result.insights);
    } catch (error) {
      setInsightsError(error.message);
    } finally {
      setIsGenerating(false);
    }
  }

  const priorityData = PRIORITY_LIST.map((meta) => ({
    label: meta.label,
    value: summary.priorityBreakdown.find((row) => row.priority === meta.value)?.count ?? 0,
  }));

  const volumeData = summary.ticketVolumeByDay.map((row) => ({
    label: formatDate(row.date).replace(/, \d{4}$/, ""),
    value: row.count,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Analytics</h1>
        <p className="text-body-sm text-text-tertiary">Real-time ticket, SLA, and workload metrics across the support org.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total tickets" value={summary.totalTickets} />
        <MetricCard label="Open tickets" value={summary.openTickets} />
        <MetricCard label="Breached" value={summary.breachedTickets} />
        <MetricCard label="Avg. resolution" value={formatMinutes(summary.avgResolutionMinutes)} hint={`${summary.resolvedTicketCount} resolved`} />
        <MetricCard label="Avg. first response" value={formatMinutes(summary.avgFirstResponseMinutes)} hint={`${summary.respondedTicketCount} responded`} />
        <MetricCard label="SLA compliance" value={formatPercent(summary.slaComplianceRate)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart title="Ticket volume (last 30 days)" data={volumeData} barClassName="fill-primary" />
        <BarChart title="Tickets by priority" data={priorityData} barClassName="fill-primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-90 border-collapse">
            <thead>
              <tr>
                <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell className="w-24">Open</TableHeaderCell>
                <TableHeaderCell className="w-24">Total</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {summary.workloadByAgent.length === 0 ? (
                <tr>
                  <TableCell colSpan={3} className="text-center text-text-tertiary">
                    No tickets have been assigned to an agent yet.
                  </TableCell>
                </tr>
              ) : (
                summary.workloadByAgent.map((row) => (
                  <TableRow key={row.agentId}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.open}</TableCell>
                    <TableCell>{row.total}</TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-90 border-collapse">
            <thead>
              <tr>
                <TableHeaderCell>Team</TableHeaderCell>
                <TableHeaderCell className="w-24">Open</TableHeaderCell>
                <TableHeaderCell className="w-24">Total</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {summary.workloadByTeam.length === 0 ? (
                <tr>
                  <TableCell colSpan={3} className="text-center text-text-tertiary">
                    No teams have any tickets yet.
                  </TableCell>
                </tr>
              ) : (
                summary.workloadByTeam.map((row) => (
                  <TableRow key={row.teamId ?? "unassigned"}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.open}</TableCell>
                    <TableCell>{row.total}</TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-card p-space-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-label-md font-semibold text-text-primary">AI Insights</h2>
          <Button variant="secondary" size="compact" disabled={isGenerating} onClick={handleGenerateInsights}>
            {isGenerating ? "Generating…" : "Generate AI Insights"}
          </Button>
        </div>
        {insightsError ? <p className="text-label-sm text-sla-critical-text">{insightsError}</p> : null}
        {insights ? (
          <p className="whitespace-pre-wrap text-body-sm text-text-primary">{insights}</p>
        ) : (
          <p className="text-body-sm text-text-tertiary">
            Generate a short narrative summary of the metrics above using Gemini. This is advisory only — it never changes any data.
          </p>
        )}
      </div>
    </div>
  );
}
