import mongoose from "mongoose";

/**
 * Mirrors server/models/Session.js exactly, but kept as a separate
 * collection/cookie (see lib/portal/session.js's SESSION_COOKIE_NAME)
 * rather than reusing Session with a discriminator: staff and customers are
 * different trust domains with different logout/expiry needs, and this way
 * a browser can hold a staff session and a customer session at the same
 * time without either clobbering the other.
 */
const customerSessionSchema = new mongoose.Schema(
  {
    sessionToken: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

customerSessionSchema.index({ customer: 1 });
customerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.CustomerSession || mongoose.model("CustomerSession", customerSessionSchema);
