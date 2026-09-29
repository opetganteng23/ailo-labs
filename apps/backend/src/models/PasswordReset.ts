import { model, models, Schema } from "mongoose";

/**
 * One-time password reset link. Only a SHA-256 hash of the token is stored, so
 * a database leak doesn't expose usable links. Expired documents are removed
 * by MongoDB's TTL monitor.
 */
const passwordResetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: Date,
  },
  { timestamps: true },
);

export const PasswordReset = models.PasswordReset || model("PasswordReset", passwordResetSchema);
