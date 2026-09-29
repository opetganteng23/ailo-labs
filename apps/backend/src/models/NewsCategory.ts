import { model, models, Schema } from "mongoose";

const newsCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true },
);

export const NewsCategory = models.NewsCategory || model("NewsCategory", newsCategorySchema);

export const DEFAULT_NEWS_CATEGORIES = ["General", "Collaboration", "Research", "Event"];
