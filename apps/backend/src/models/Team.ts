import { model, models, Schema } from "mongoose";

import { TEAM_CATEGORIES } from "./teamCategories";

export { TEAM_CATEGORIES };

const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    photo: String,
    position: { type: String, required: true },
    category: { type: String, default: "Peneliti" },
    jenjang: String,
    studyProgram: String,
    displayOrder: { type: Number, default: 0 },
    bio: String,
    researchInterests: { type: [String], default: [], index: true },
    email: { type: String, trim: true, lowercase: true },
    profiles: {
      linkedin: String,
      orcid: String,
      googleScholar: String,
      sinta: String,
      scopus: String,
    },
    scopusAuthorId: String,
    scopusData: {
      hIndex: Number,
      citationCount: Number,
      documentCount: Number,
      publications: [{ title: String, year: Number, journal: String, doi: String, link: String }],
      lastFetchedAt: Date,
    },
    isActive: { type: Boolean, default: true, index: true },
    // Edits a lecturer made from the dosen dashboard, applied once an admin approves them.
    pendingChanges: { type: Schema.Types.Mixed },
    pendingSince: Date,
    // Set when this profile was created from Admin -> Members -> "Include in Team Board",
    // so toggling it again finds the same profile instead of creating a duplicate.
    member: { type: Schema.Types.ObjectId, ref: "Member", index: true },
  },
  { timestamps: true },
);

teamSchema.index({ category: 1, displayOrder: 1, name: 1 });

export const Team = models.Team || model("Team", teamSchema);
