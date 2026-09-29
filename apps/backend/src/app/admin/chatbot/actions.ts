"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { encryptSecret } from "@/lib/secretCrypto";
import { ChatbotQA } from "@/models/ChatbotQA";
import { SiteSettings } from "@/models/SiteSettings";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
  return session;
}

export async function saveKnowledgeSourcesAction(formData: FormData) {
  await requireAdminSession();
  await withFlash(
    async () => {
      await connectToDatabase();
      const sources = formData.getAll("source").map(String);
      await SiteSettings.findOneAndUpdate({ key: "global" }, { $set: { "chatbot.knowledgeSources": sources } }, { upsert: true });
    },
    { success: "Knowledge sources updated.", error: "Couldn't update the knowledge sources. Please try again." },
  );

  revalidatePath("/admin/chatbot");
}

export async function saveModelSettingsAction(formData: FormData) {
  await requireAdminSession();
  await withFlash(
    async () => {
      await connectToDatabase();

      const set: Record<string, unknown> = {
        "chatbot.provider": String(formData.get("provider") ?? "openai"),
        "chatbot.baseUrl": String(formData.get("baseUrl") ?? ""),
        "chatbot.chatModel": String(formData.get("chatModel") ?? ""),
        "chatbot.embeddingModel": String(formData.get("embeddingModel") ?? ""),
        "chatbot.temperature": Number(formData.get("temperature") ?? 0.3),
        "chatbot.maxTokens": Number(formData.get("maxTokens") ?? 800),
        "chatbot.topK": Number(formData.get("topK") ?? 5),
        "chatbot.systemPrompt": String(formData.get("systemPrompt") ?? ""),
        "chatbot.fallbackReply": String(formData.get("fallbackReply") ?? ""),
        "chatbot.perVisitorDailyLimit": Number(formData.get("perVisitorDailyLimit") ?? 20),
      };

      const budget = formData.get("monthlyTokenBudget");
      set["chatbot.monthlyTokenBudget"] = budget ? Number(budget) : undefined;

      const apiKey = String(formData.get("apiKey") ?? "").trim();
      if (apiKey) {
        set["chatbot.apiKeyEncrypted"] = encryptSecret(apiKey);
        set["chatbot.apiKeyLast4"] = apiKey.slice(-4);
      }

      await SiteSettings.findOneAndUpdate({ key: "global" }, { $set: set }, { upsert: true });
    },
    { success: "AI settings saved.", error: "Couldn't save the AI settings. Please try again." },
  );

  revalidatePath("/admin/chatbot/model");
  revalidatePath("/admin/chatbot");
}

export async function createQAAction(formData: FormData) {
  await requireAdminSession();
  await withFlash(
    async () => {
      const question = String(formData.get("question") ?? "").trim();
      const answer = String(formData.get("answer") ?? "").trim();
      if (!question || !answer) throw new FlashError("Please fill in both the question and the answer.");
      await connectToDatabase();
      await ChatbotQA.create({ question, answer });
    },
    { success: "Q&A added.", error: "Couldn't add the Q&A. Please try again." },
  );
  revalidatePath("/admin/chatbot");
}

export async function deleteQAAction(formData: FormData) {
  await requireAdminSession();
  await withFlash(
    async () => {
      await connectToDatabase();
      await ChatbotQA.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Q&A deleted.", error: "Couldn't delete the Q&A. Please try again." },
  );
  revalidatePath("/admin/chatbot");
}
