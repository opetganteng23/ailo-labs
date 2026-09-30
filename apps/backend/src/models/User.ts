import { model, models, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["super_admin", "admin", "staff_lab", "dosen", "borrower"], required: true },
    phone: { type: String, trim: true },
    photo: String,
    // Set when the account was created from (or linked to) a member registration.
    member: { type: Schema.Types.ObjectId, ref: "Member" },
    // A lecturer ("dosen") account edits this team profile from the dosen dashboard.
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const User = models.User || model("User", userSchema);
