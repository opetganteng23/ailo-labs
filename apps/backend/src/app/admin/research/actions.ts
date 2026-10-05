"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { sanitizeRichText } from "@/lib/sanitizeHtml";
import { Research } from "@/models/Research";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

function readResearch(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) throw new FlashError(`Please fill in the ${[!title && "title", !description && "summary"].filter(Boolean).join(" and ")}.`, "warning");
  return {
    title,
    description,
    content: sanitizeRichText(String(formData.get("content") ?? "")),
    status: ["published", "review", "archived"].includes(String(formData.get("status"))) ? String(formData.get("status")) : "draft",
    image: String(formData.get("image") ?? ""),
  };
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

export async function createResearchAction(formData: FormData) {
  await requireAdmin();
  const ok = await withFlash(
    async () => {
      const data = readResearch(formData);
      const manualDate = readManualDate(formData);
      await connectToDatabase();
      await Research.create({
        ...data,
        slug: slugify(data.title),
        publishedAt: data.status === "published" ? (manualDate ?? new Date()) : undefined,
        publishedAtManual: isManualDate(formData),
      });
    },
    { success: "Research saved.", error: "Couldn't save the research item. Please try again." },
  );
  revalidatePath("/admin/research");
  if (ok) redirect("/admin/research");
}

export async function updateResearchAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const ok = await withFlash(
    async () => {
      const data = readResearch(formData);
      const manualDate = readManualDate(formData);
      await connectToDatabase();
      const existing = await Research.findById(id).lean<{ publishedAt?: Date }>();
      if (!existing) throw new FlashError("This research item no longer exists.");
      await Research.findByIdAndUpdate(id, {
        ...data,
        publishedAt: data.status === "published" ? (manualDate ?? existing.publishedAt ?? new Date()) : undefined,
        publishedAtManual: isManualDate(formData),
      });
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/admin/research");
  if (ok) redirect("/admin/research");
}

export async function deleteResearchAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      await Research.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Research deleted.", error: "Couldn't delete the research item. Please try again." },
  );
  revalidatePath("/admin/research");
}

/** Archives a research item (hides it from the public site, keeps it) or restores it to draft. */
export async function setResearchArchivedAction(formData: FormData) {
  await requireAdmin();
  const archive = formData.get("archive") === "1";
  await withFlash(
    async () => {
      await connectToDatabase();
      await Research.findByIdAndUpdate(String(formData.get("id")), { status: archive ? "archived" : "draft" });
    },
    { success: archive ? "Research archived." : "Research restored to drafts.", error: "Couldn't update the research item. Please try again." },
  );
  revalidatePath("/admin/research");
  revalidatePath("/research");
  revalidatePath("/");
}
