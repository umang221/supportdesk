/**
 * Minimal recurring-job scheduler for a single Node process.
 *
 * Why not Redis/BullMQ: this app runs as one Node process (see
 * server/utils/db.js's cached connection and server/realtime/eventBus.js's
 * in-process pub/sub — both already assume this). There is exactly one
 * recurring job so far (SLA monitoring) with no need for cross-process
 * coordination, distributed locking, retries with backoff, or a job queue
 * fed by many producers — the things a real queue/broker earns its keep on.
 * Introducing Redis+BullMQ now would add infrastructure (a Redis instance,
 * a separate worker process/deployment, connection config) to solve
 * problems this app doesn't have yet. The abstraction below is deliberately
 * shaped like a tiny subset of that world (named jobs, an interval, a
 * status you can query) so swapping in a real queue later — once there are
 * multiple job types, multiple server instances, or a need for durable
 * retries — means replacing this module's internals, not the call sites in
 * instrumentation.js or the job definitions themselves.
 *
 * Cached on `global` for the same reason as connectDB/eventBus: Next dev
 * mode clears the module cache on every hot reload, which would otherwise
 * register a fresh, duplicate `setInterval` on every edit.
 */
let registry = global._jobRegistry;
if (!registry) {
  registry = global._jobRegistry = new Map();
}

/** Registers a job by name (a no-op if already registered — see module doc). Does not start it. */
export function registerJob({ name, intervalMs, run }) {
  if (registry.has(name)) return registry.get(name);

  const state = { name, intervalMs, run, timer: null, isRunning: false, lastRunAt: null, lastResult: null, lastError: null };
  registry.set(name, state);
  return state;
}

async function tick(state) {
  // Overlap guard: if a previous run is still in flight (e.g. a slow DB),
  // skip this tick rather than piling up concurrent runs of the same job.
  if (state.isRunning) return;

  state.isRunning = true;
  try {
    state.lastResult = await state.run();
    state.lastError = null;
  } catch (error) {
    state.lastError = error;
    console.error(`[jobs] "${state.name}" run failed:`, error);
  } finally {
    state.isRunning = false;
    state.lastRunAt = new Date();
  }
}

/** Starts a registered job's interval (a no-op if already started). Also runs it once immediately. */
export function startJob(name) {
  const state = registry.get(name);
  if (!state || state.timer) return;
  state.timer = setInterval(() => tick(state), state.intervalMs);
  tick(state);
}

export function stopJob(name) {
  const state = registry.get(name);
  if (state?.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

/** Runs a registered job once, outside its interval — used by tests/manual triggers. */
export function runJobOnce(name) {
  const state = registry.get(name);
  if (!state) throw new Error(`Unknown job: ${name}`);
  return tick(state);
}

export function getJobStatus(name) {
  const state = registry.get(name);
  if (!state) return null;
  return {
    name: state.name,
    isRunning: state.isRunning,
    lastRunAt: state.lastRunAt,
    lastResult: state.lastResult,
    lastError: state.lastError?.message ?? null,
  };
}
