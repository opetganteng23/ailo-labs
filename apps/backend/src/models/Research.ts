import { model, models, Schema } from "mongoose";

const researchSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, default: "" },
    image: String,
    relatedTeamMembers: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    // "review" = submitted by a lecturer, waiting for an admin to publish.
    status: { type: String, enum: ["draft", "review", "published"], default: "draft", index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    reviewNote: String,
    publishedAt: Date,
    /** True when an admin picked the date by hand instead of using the publish moment. */
    publishedAtManual: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Research = models.Research || model("Research", researchSchema);
