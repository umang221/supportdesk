import mongoose from "mongoose";
import { ROLES } from "@/lib/constants/roles";

export const USER_ROLES = Object.values(ROLES);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    title: { type: String, trim: true },
    role: { type: String, enum: USER_ROLES, default: "agent" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    avatarUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ team: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
