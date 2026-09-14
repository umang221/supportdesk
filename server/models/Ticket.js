import mongoose from "mongoose";
import { PRIORITIES } from "@/lib/constants/priorities";
import { STATUSES } from "@/lib/constants/statuses";
import { SLA_STATES } from "@/lib/constants/sla-states";

export const TICKET_CHANNELS = ["email", "chat", "phone"];

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, sparse: true, trim: true },
    subject: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    priority: {
      type: String,
      enum: Object.values(PRIORITIES),
      default: PRIORITIES.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.OPEN,
    },
    slaState: {
      type: String,
      enum: Object.values(SLA_STATES),
      default: SLA_STATES.HEALTHY,
    },
    channel: { type: String, enum: TICKET_CHANNELS, default: "email" },
    dueAt: { type: Date, default: null },
    // Set once, the first time an agent replies / the ticket is resolved —
    // used by server/services/analyticsService.js for first-response/
    // resolution-time metrics. Never set from client input.
    firstRespondedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ dueAt: 1 });
ticketSchema.index({ assignee: 1 });
ticketSchema.index({ team: 1 });
ticketSchema.index({ customer: 1 });
ticketSchema.index({ slaState: 1 });

export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
