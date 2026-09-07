import { model, models, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["super_admin", "admin", "staff_lab"], required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const User = models.User || model("User", userSchema);
