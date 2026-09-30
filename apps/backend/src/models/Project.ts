import { model, models, Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, default: "" },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["ongoing", "completed", "planned"], default: "planned" },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    startDate: Date,
    endDate: Date,
    // Lecturer submissions wait in "review" until an admin publishes them.
    publishStatus: { type: String, enum: ["review", "published"], default: "published", index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    reviewNote: String,
  },
  { timestamps: true },
);

export const Project = models.Project || model("Project", projectSchema);
