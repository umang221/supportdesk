import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

messageSchema.index({ ticket: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
