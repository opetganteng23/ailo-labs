import { model, models, Schema } from "mongoose";

const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    photo: String,
    position: { type: String, required: true },
    bio: String,
    email: { type: String, trim: true, lowercase: true },
    scopusAuthorId: String,
    scopusData: {
      hIndex: Number,
      citationCount: Number,
      documentCount: Number,
      publications: [{ title: String, year: Number, journal: String, doi: String, link: String }],
      lastFetchedAt: Date,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Team = models.Team || model("Team", teamSchema);
