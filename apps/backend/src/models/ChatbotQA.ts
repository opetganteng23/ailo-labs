import { model, models, Schema } from "mongoose";

const chatbotQASchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const ChatbotQA = models.ChatbotQA || model("ChatbotQA", chatbotQASchema);
