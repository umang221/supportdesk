import mongoose from "mongoose";

export const CUSTOMER_PLANS = ["Starter", "Pro", "Business", "Enterprise"];

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    plan: { type: String, enum: CUSTOMER_PLANS, default: "Starter" },
    avatarUrl: { type: String, trim: true },
    // Not required: seeded/legacy customer records may predate self-service
    // auth (see scripts/seed.mjs). Such a record simply can't log in until
    // a password is set via registration-on-existing-email or reset —
    // verifyCustomerCredentials treats a missing hash as "no login possible",
    // never as an open account.
    passwordHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

customerSchema.index({ company: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);
