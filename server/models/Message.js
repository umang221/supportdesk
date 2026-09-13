import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
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
