"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { KnowledgeDoc } from "@/models/KnowledgeDoc";

async function requireAdminSession() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
  return session;
}

function readDoc(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const content = String(formData.get("content") ?? "").replace(/\r\n/g, "\n").trim();
  const missing = [!title && "title", !source && "source", !content && "text"].filter(Boolean);
  if (missing.length) throw new FlashError(`Please fill in the ${missing.join(", ")}.`, "warning");
  if (content.length > 200_000) throw new FlashError("The text is too long (200,000 characters at most). Split it into several documents.", "warning");
  return { title, source, content, status: formData.get("status") === "draft" ? "draft" : "published" };
}

const REMINDER = " Run Reindex on the Knowledge tab so the chatbot uses it.";

export async function createKnowledgeDocAction(formData: FormData) {
  await requireAdminSession();
  const ok = await withFlash(
    async () => {
      const data = readDoc(formData);
      await connectToDatabase();
      await KnowledgeDoc.create(data);
    },
    { success: `Document added.${REMINDER}`, error: "Couldn't add the document. Please try again." },
  );
  revalidatePath("/admin/chatbot/documents");
  if (ok) redirect("/admin/chatbot/documents");
}

export async function updateKnowledgeDocAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id"));
  const ok = await withFlash(
    async () => {
      const data = readDoc(formData);
      await connectToDatabase();
      const doc = await KnowledgeDoc.findByIdAndUpdate(id, data);
      if (!doc) throw new FlashError("This document no longer exists.");
    },
    { success: `Document saved.${REMINDER}`, error: "Couldn't save the document. Please try again." },
  );
  revalidatePath("/admin/chatbot/documents");
  if (ok) redirect("/admin/chatbot/documents");
}

export async function deleteKnowledgeDocAction(formData: FormData) {
  await requireAdminSession();
  await withFlash(
    async () => {
      await connectToDatabase();
      await KnowledgeDoc.findByIdAndDelete(String(formData.get("id")));
    },
    { success: `Document deleted.${REMINDER}`, error: "Couldn't delete the document. Please try again." },
  );
  revalidatePath("/admin/chatbot/documents");
}
