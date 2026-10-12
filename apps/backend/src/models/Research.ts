import { model, models, Schema } from "mongoose";

const researchSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, default: "" },
    categories: { type: [String], default: [], index: true },
    image: String,
    relatedTeamMembers: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    reactions: {
      keren: { type: Number, default: 0 },
      inspiratif: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      belajarBaru: { type: Number, default: 0 },
    },
    // "review" = submitted by a lecturer, waiting for an admin to publish.
    status: { type: String, enum: ["draft", "review", "published", "archived"], default: "draft", index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    reviewNote: String,
    publishedAt: Date,
    /** True when an admin picked the date by hand instead of using the publish moment. */
    publishedAtManual: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Research = models.Research || model("Research", researchSchema);
