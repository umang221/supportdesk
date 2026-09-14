import mongoose from "mongoose";

/**
 * Append-only record of sensitive admin actions (user/team/role/SLA-policy
 * changes). `actor*` fields are denormalized copies of the acting user's
 * name/email/role at the time of the action, taken from the server-side
 * session (never client input) — so the log stays readable even if the
 * actor's account is later renamed or deactivated.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
