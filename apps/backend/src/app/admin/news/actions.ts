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

function readStatus(formData: FormData): "draft" | "review" | "published" | "archived" {
  const status = formData.get("status");
  return status === "published" || status === "review" || status === "archived" ? status : "draft";
}

/** Server-side check of the fields the form marks as required. */
function readArticle(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = sanitizeRichText(String(formData.get("content") ?? "")).trim();
  const category = String(formData.get("category") ?? "").trim();
  const missing = [!title && "headline", !summary && "summary", !content && "article body", !category && "category"].filter(Boolean);
  if (missing.length) throw new FlashError(`Please fill in the ${missing.join(", ")}.`, "warning");
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

/** Manual date override: "manual" + a date input, or "auto" to keep using the publish moment. */
function readManualDate(formData: FormData): Date | undefined {
  if (formData.get("dateMode") !== "manual") return undefined;
  const raw = String(formData.get("publishedAtManual") ?? "").trim();
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isManualDate(formData: FormData): boolean {
  return formData.get("dateMode") === "manual" && Boolean(String(formData.get("publishedAtManual") ?? "").trim());
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
      const manualDate = readManualDate(formData);
      await connectToDatabase();
      await News.create({
        ...article,
        slug: slugify(article.title),
        tags: readTags(formData),
        status,
        publishedAt: status === "published" ? (manualDate ?? new Date()) : undefined,
        publishedAtManual: isManualDate(formData),
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
      const manualDate = readManualDate(formData);
      const id = String(formData.get("id"));
      await connectToDatabase();
      const existing = await News.findById(id).lean<{ publishedAt?: Date }>();
      if (!existing) throw new FlashError("This article no longer exists.");
      await News.findByIdAndUpdate(id, {
        ...article,
        tags: readTags(formData),
        status,
        publishedAt: status === "published" ? (manualDate ?? existing.publishedAt ?? new Date()) : undefined,
        publishedAtManual: isManualDate(formData),
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

/** Archives an article (hides it from the public site, keeps it) or restores it to draft. */
export async function setNewsArchivedAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
  const archive = formData.get("archive") === "1";
  await withFlash(
    async () => {
      await connectToDatabase();
      await News.findByIdAndUpdate(String(formData.get("id")), { status: archive ? "archived" : "draft", ...(archive ? {} : { publishedAt: undefined }) });
    },
    { success: archive ? "Article archived." : "Article restored to drafts.", error: "Couldn't update the article. Please try again." },
  );
  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
}
