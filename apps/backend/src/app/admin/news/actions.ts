"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDraftFromFiveW1H } from "@/lib/newsDraft";
import { sanitizeRichText } from "@/lib/sanitizeHtml";
import { News } from "@/models/News";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readStatus(formData: FormData): "draft" | "review" | "published" {
  const status = formData.get("status");
  return status === "published" || status === "review" ? status : "draft";
}

/** Server-side check of the fields the form marks as required. */
function readArticle(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = sanitizeRichText(String(formData.get("content") ?? "")).trim();
  const category = String(formData.get("category") ?? "").trim();
  const missing = [!title && "headline", !summary && "summary", !content && "article body", !category && "category"].filter(Boolean);
  if (missing.length) throw new FlashError(`Please fill in the ${missing.join(", ")}.`);
  return { title, summary, content, category };
}

function read5W1H(formData: FormData) {
  const v = (k: string) => String(formData.get(k) ?? "").trim();
  return { what: v("what"), who: v("who"), when: v("when"), where: v("where"), why: v("why"), how: v("how") };
}

function readTags(formData: FormData): string[] {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function generateDraftAction(_prevState: unknown, formData: FormData) {
  const draft = formatDraftFromFiveW1H({
    what: String(formData.get("what") ?? ""),
    who: String(formData.get("who") ?? ""),
    when: String(formData.get("when") ?? ""),
    where: String(formData.get("where") ?? ""),
    why: String(formData.get("why") ?? ""),
    how: String(formData.get("how") ?? ""),
  });
  return { draft };
}

export async function createNewsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");

  const saved = await withFlash(
    async () => {
      const article = readArticle(formData);
      const status = readStatus(formData);
      await connectToDatabase();
      await News.create({
        ...article,
        slug: slugify(article.title),
        tags: readTags(formData),
        status,
        publishedAt: status === "published" ? new Date() : undefined,
        author: session.sub,
        images: formData.get("image") ? [String(formData.get("image"))] : [],
        source5W1H: read5W1H(formData),
      });
    },
    { success: "Article saved.", error: "Couldn't save the article. Please try again." },
  );

  revalidatePath("/admin/news");
  if (saved) redirect("/admin/news");
}

export async function updateNewsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");

  const saved = await withFlash(
    async () => {
      const article = readArticle(formData);
      const status = readStatus(formData);
      const id = String(formData.get("id"));
      await connectToDatabase();
      const existing = await News.findById(id).lean<{ publishedAt?: Date }>();
      if (!existing) throw new FlashError("This article no longer exists.");
      await News.findByIdAndUpdate(id, {
        ...article,
        tags: readTags(formData),
        status,
        publishedAt: status === "published" ? existing.publishedAt ?? new Date() : undefined,
        images: formData.get("image") ? [String(formData.get("image"))] : [],
        source5W1H: read5W1H(formData),
      });
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );

  revalidatePath("/admin/news");
  if (saved) redirect("/admin/news");
}

export async function deleteNewsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");

  await withFlash(
    async () => {
      await connectToDatabase();
      await News.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Article deleted.", error: "Couldn't delete the article. Please try again." },
  );
  revalidatePath("/admin/news");
}
