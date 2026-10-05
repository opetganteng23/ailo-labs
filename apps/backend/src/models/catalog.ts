import { model, models, Schema } from "mongoose";

/**
 * Services, books and partners are all simple "catalog" entries - a title,
 * a short description, an optional image, plus a few optional extras - so
 * they share one schema shape (each still gets its own collection).
 */
function catalogSchema() {
  return new Schema(
    {
      title: { type: String, required: true, trim: true },
      slug: { type: String, required: true, unique: true, trim: true },
      description: { type: String, default: "" },
      content: { type: String, default: "" },
      image: String,
      link: String,
      /** Services: every category the entry belongs to. */
      categories: { type: [String], default: [] },
      /** Books: an uploaded PDF that can be read on the site. */
      file: String,
      /** Partners only: the uploaded logo is white/light, so the strip shows it on a dark chip instead of a white one. */
      logoDark: { type: Boolean, default: false },
      author: String,
      year: String,
      order: { type: Number, default: 0 },
      status: { type: String, enum: ["draft", "published"], default: "published", index: true },
    },
    { timestamps: true },
  );
}

export const Service = models.Service || model("Service", catalogSchema());
export const Book = models.Book || model("Book", catalogSchema());
export const Partner = models.Partner || model("Partner", catalogSchema());
