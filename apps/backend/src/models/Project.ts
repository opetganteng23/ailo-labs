import { model, models, Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["ongoing", "completed", "planned"], default: "planned" },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true },
);

export const Project = models.Project || model("Project", projectSchema);
