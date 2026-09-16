import mongoose from "mongoose";

/**
 * Append-only record of sensitive actions — originally admin-only
 * (user/team/role/SLA-policy changes), now also self-service actions a
 * staff user or customer takes on their own account (profile/avatar/
 * password changes — see userService/customerAuthService). `actor*` fields
 * are denormalized copies of the acting principal's name/email at the time
 * of the action, taken from the server-side session (never client input) —
 * so the log stays readable even if the account is later renamed/deleted.
 * `actorModel` (mirrors Message.authorModel's pattern) lets `actor` point at
 * either collection via refPath, since an action can now be self-performed
 * by a Customer, not just a User.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actorModel: { type: String, enum: ["User", "Customer"], default: "User" },
    actor: { type: mongoose.Schema.Types.ObjectId, refPath: "actorModel", required: true },
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
