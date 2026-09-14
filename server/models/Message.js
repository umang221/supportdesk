import mongoose from "mongoose";

export const MESSAGE_TYPES = ["customer_reply", "agent_reply", "internal_note", "system"];

// Cloudinary asset reference, not the file itself — see
// server/attachments/attachmentService.js. `url` is deliberately not stored:
// it's a short-lived signed URL regenerated fresh on every read so an old,
// possibly-expired link is never served from a stale document.
const attachmentSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },
    mimeType: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    // Stable id from the seed source data, used to upsert idempotently since
    // messages have no other natural unique key.
    legacyId: { type: String, unique: true, sparse: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    authorModel: { type: String, enum: ["Customer", "User"], required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "authorModel",
    },
    body: { type: String, required: true, trim: true },
    // Optional (no default) so messages seeded before this field existed
    // stay valid; server/services/messageService.js derives a fallback from
    // authorModel for those when presenting them. Every message created
    // through createMessage() from now on always sets it explicitly.
    type: { type: String, enum: MESSAGE_TYPES },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

messageSchema.index({ ticket: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
