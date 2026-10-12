import { model, models, Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, default: "" },
    categories: { type: [String], default: [], index: true },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["ongoing", "completed", "planned"], default: "planned" },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    reactions: {
      keren: { type: Number, default: 0 },
      inspiratif: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      belajarBaru: { type: Number, default: 0 },
    },
    startDate: Date,
    endDate: Date,
    // Lecturer submissions wait in "review" until an admin publishes them.
    publishStatus: { type: String, enum: ["review", "published", "archived"], default: "published", index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    reviewNote: String,
    publishedAt: Date,
    /** True when an admin picked the date by hand instead of using the publish moment. */
    publishedAtManual: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Project = models.Project || model("Project", projectSchema);
