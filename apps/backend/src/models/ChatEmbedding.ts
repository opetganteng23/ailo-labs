import { model, models, Schema } from "mongoose";

const chatEmbeddingSchema = new Schema(
  {
    sourceType: {
      type: String,
      enum: ["news", "research", "project", "team", "lab", "about", "service", "book", "partner"],
      required: true,
      index: true,
    },
    sourceId: { type: Schema.Types.ObjectId, required: true },
    chunkText: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

export const ChatEmbedding =
  models.ChatEmbedding || model("ChatEmbedding", chatEmbeddingSchema);
