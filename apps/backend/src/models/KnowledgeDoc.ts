import { model, models, Schema } from "mongoose";

/** Free-form reference text the chatbot can answer from (books, proposals, FAQs). Not shown on the public site. */
const knowledgeDocSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    /** Where the text comes from; a re-import replaces every document with the same source. */
    source: { type: String, required: true, trim: true, index: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["published", "draft"], default: "published", index: true },
  },
  { timestamps: true },
);

export const KnowledgeDoc = models.KnowledgeDoc || model("KnowledgeDoc", knowledgeDocSchema);
