import { model, models, Schema } from "mongoose";

const newsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    reviewNote: String,
    images: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    // Every category the article belongs to; `category` stays the first one for older data and the API.
    categories: { type: [String], default: [], index: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: Date,
    /** True when an admin picked the date by hand instead of using the publish moment. */
    publishedAtManual: { type: Boolean, default: false },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    reactions: {
      keren: { type: Number, default: 0 },
      inspiratif: { type: Number, default: 0 },
      wow: { type: Number, default: 0 },
      belajarBaru: { type: Number, default: 0 },
    },
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

newsSchema.pre("validate", function () {
  const doc = this as unknown as { category?: string; categories?: string[] };
  if ((!doc.categories || doc.categories.length === 0) && doc.category) doc.categories = [doc.category];
});

export const News = models.News || model("News", newsSchema);
