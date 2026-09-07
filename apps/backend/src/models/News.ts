import { model, models, Schema } from "mongoose";

const newsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: Date,
    author: { type: Schema.Types.ObjectId, ref: "User" },
    source5W1H: {
      what: String,
      who: String,
      when: String,
      where: String,
      why: String,
      how: String,
    },
  },
  { timestamps: true },
);

newsSchema.index({ status: 1, publishedAt: -1 });

export const News = models.News || model("News", newsSchema);
