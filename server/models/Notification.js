import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "sla_critical",
  "sla_breached",
  "ticket_assigned",
  "ticket_unassigned",
  "ticket_resolved",
  "customer_reply",
  "mention",
];

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, trim: true },
    relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
