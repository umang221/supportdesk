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
    // Set once, at invite time (server/services/userService.js's createUser)
    // or by an admin-triggered reset — cleared the moment the token is
    // used. While a token is pending, passwordHash is a random, unusable
    // placeholder (see createUser), so the account simply can't log in
    // until the invite/reset link is completed.
    passwordSetupTokenHash: { type: String, select: false },
    passwordSetupTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ team: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
