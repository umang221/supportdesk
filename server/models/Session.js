import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionToken: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1 });
// TTL index: MongoDB automatically deletes a session doc once expiresAt passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model("Session", sessionSchema);
