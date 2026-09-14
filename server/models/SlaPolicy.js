import mongoose from "mongoose";
import { PRIORITIES } from "@/lib/constants/priorities";

/**
 * DB-backed override of the default SLA policy (lib/constants/sla-policy.js)
 * per priority. One document per priority, upserted by
 * server/services/slaPolicyService.js when an admin edits it — most
 * deployments will simply run on the hardcoded defaults and never create a
 * row here at all.
 */
const slaPolicySchema = new mongoose.Schema(
  {
    priority: { type: String, enum: Object.values(PRIORITIES), required: true, unique: true },
    firstResponseMinutes: { type: Number, required: true, min: 1 },
    resolutionMinutes: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.SlaPolicy || mongoose.model("SlaPolicy", slaPolicySchema);
