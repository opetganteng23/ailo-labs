import { model, models, Schema } from "mongoose";

import { MEMBER_CATEGORIES } from "@/lib/memberCategories";

export { MEMBER_CATEGORIES };

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    affiliation: { type: String, required: true, trim: true },
    requestedAs: { type: String, enum: MEMBER_CATEGORIES, required: true },
    approvedAs: { type: String, enum: MEMBER_CATEGORIES },
    photo: String,
    proofDocument: String,
    studyLevel: String,
    profiles: {
      linkedin: String,
      orcid: String,
      googleScholar: String,
      sinta: String,
      scopus: String,
    },
    researchInterests: { type: [String], default: [] },
    motivation: String,
    showProfilePublicly: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    // Card validity. Null/undefined means no expiry.
    validUntil: Date,
    cardId: { type: String, unique: true, sparse: true },
    reviewNote: String,
    verification: {
      nameMatches: { type: Boolean, default: false },
      affiliationConfirmed: { type: Boolean, default: false },
      photoSuitable: { type: Boolean, default: false },
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true },
);

export const Member = models.Member || model("Member", memberSchema);
