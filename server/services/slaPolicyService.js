import { connectDB } from "@/server/utils/db";
import SlaPolicy from "@/server/models/SlaPolicy";
import { PRIORITIES } from "@/lib/constants/priorities";
import { DEFAULT_SLA_POLICY_BY_PRIORITY, setSlaPolicyOverride } from "@/lib/constants/sla-policy";
import { HttpError } from "@/server/utils/http-error";
import { recordAudit } from "@/server/services/auditService";

const PRIORITY_VALUES = Object.values(PRIORITIES);

/**
 * Loads any DB-stored overrides into the in-memory policy slaService reads
 * from. Safe to call repeatedly (e.g. once at process start via
 * instrumentation.js, or lazily here) — it only ever overwrites the
 * in-memory value with what's actually stored, never the other way around.
 */
export async function loadSlaPolicyOverrides() {
  await connectDB();
  const stored = await SlaPolicy.find();
  for (const doc of stored) {
    setSlaPolicyOverride(doc.priority, {
      firstResponseMinutes: doc.firstResponseMinutes,
      resolutionMinutes: doc.resolutionMinutes,
    });
  }
}

/** Current effective policy for every priority, with a flag for whether it's a stored override or still the default. */
export async function getEffectiveSlaPolicies() {
  await connectDB();
  const stored = await SlaPolicy.find();
  const storedByPriority = new Map(stored.map((doc) => [doc.priority, doc]));

  return PRIORITY_VALUES.map((priority) => {
    const override = storedByPriority.get(priority);
    const defaults = DEFAULT_SLA_POLICY_BY_PRIORITY[priority];
    return {
      priority,
      firstResponseMinutes: override?.firstResponseMinutes ?? defaults.firstResponseMinutes,
      resolutionMinutes: override?.resolutionMinutes ?? defaults.resolutionMinutes,
      isCustom: Boolean(override),
    };
  });
}

/**
 * Upserts a policy override for one priority, applies it to the running
 * process immediately (see lib/constants/sla-policy.js), and audits the
 * change. `actingUser` must already be authorized (admin) by the caller.
 */
export async function updateSlaPolicy(priority, { firstResponseMinutes, resolutionMinutes }, actingUser) {
  if (!PRIORITY_VALUES.includes(priority)) {
    throw new HttpError(400, "Invalid priority.", { code: "validation_error", fieldErrors: { priority: "Unknown priority." } });
  }
  if (!Number.isFinite(firstResponseMinutes) || firstResponseMinutes <= 0) {
    throw new HttpError(400, "First response time must be a positive number of minutes.", {
      code: "validation_error",
      fieldErrors: { firstResponseMinutes: "Must be a positive number." },
    });
  }
  if (!Number.isFinite(resolutionMinutes) || resolutionMinutes <= 0) {
    throw new HttpError(400, "Resolution time must be a positive number of minutes.", {
      code: "validation_error",
      fieldErrors: { resolutionMinutes: "Must be a positive number." },
    });
  }

  await connectDB();
  const updated = await SlaPolicy.findOneAndUpdate(
    { priority },
    { $set: { firstResponseMinutes, resolutionMinutes } },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  setSlaPolicyOverride(priority, { firstResponseMinutes, resolutionMinutes });

  await recordAudit({
    actingUser,
    action: "sla_policy.update",
    entityType: "SlaPolicy",
    entityId: priority,
    metadata: { priority, firstResponseMinutes, resolutionMinutes },
  });

  return { priority: updated.priority, firstResponseMinutes: updated.firstResponseMinutes, resolutionMinutes: updated.resolutionMinutes, isCustom: true };
}
