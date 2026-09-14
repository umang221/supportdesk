// Next.js instrumentation hook: register() runs once when the server
// process starts (dev and prod), before any request is handled. This is
// where the SLA monitoring job gets registered and started — see
// server/jobs/jobRunner.js for why an interval here rather than Redis/BullMQ.
const SLA_MONITOR_INTERVAL_MS = 60_000;

export async function register() {
  // instrumentation.js also loads in the edge runtime (e.g. for middleware);
  // the job needs Mongoose/Node APIs, so only start it in the Node runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerJob, startJob } = await import("@/server/jobs/jobRunner");
  const { runSlaMonitorSweep } = await import("@/server/jobs/slaMonitorJob");

  registerJob({ name: "sla-monitor", intervalMs: SLA_MONITOR_INTERVAL_MS, run: runSlaMonitorSweep });
  startJob("sla-monitor");
}
