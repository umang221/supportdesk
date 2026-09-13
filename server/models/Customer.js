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
  },
  { timestamps: true }
);

customerSchema.index({ company: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);
