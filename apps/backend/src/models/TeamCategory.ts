import { model, models, Schema } from "mongoose";

const teamCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const TeamCategory = models.TeamCategory || model("TeamCategory", teamCategorySchema);
