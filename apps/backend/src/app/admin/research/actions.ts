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
  if (!title || !description) throw new FlashError(`Please fill in the ${[!title && "title", !description && "summary"].filter(Boolean).join(" and ")}.`);
  return {
    title,
    description,
    content: sanitizeRichText(String(formData.get("content") ?? "")),
    status: formData.get("status") === "published" ? "published" : "draft",
    image: String(formData.get("image") ?? "") || undefined,
  };
}

export async function createResearchAction(formData: FormData) {
  await requireAdmin();
  const ok = await withFlash(
    async () => {
      const data = readResearch(formData);
      await connectToDatabase();
      await Research.create({ ...data, slug: slugify(data.title) });
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
      await connectToDatabase();
      await Research.findByIdAndUpdate(id, data);
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
