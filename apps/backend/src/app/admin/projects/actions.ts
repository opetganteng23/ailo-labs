"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, flash, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { sanitizeRichText } from "@/lib/sanitizeHtml";
import { Project } from "@/models/Project";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

function readProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) throw new FlashError(`Please fill in the ${[!title && "title", !description && "summary"].filter(Boolean).join(" and ")}.`);
  return {
    title,
    description,
    content: sanitizeRichText(String(formData.get("content") ?? "")),
    status: formData.get("status") ?? "planned",
    images: formData.get("image") ? [String(formData.get("image"))] : [],
  };
}

export async function createProjectAction(formData: FormData) {
  await requireAdmin();
  const ok = await withFlash(
    async () => {
      const data = readProject(formData);
      await connectToDatabase();
      await Project.create({ ...data, slug: slugify(data.title) });
    },
    { success: "Project saved.", error: "Couldn't save the project. Please try again." },
  );
  revalidatePath("/admin/projects");
  if (ok) redirect("/admin/projects");
}

export async function updateProjectAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const ok = await withFlash(
    async () => {
      const data = readProject(formData);
      await connectToDatabase();
      await Project.findByIdAndUpdate(id, data);
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/admin/projects");
  if (ok) redirect("/admin/projects");
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      await Project.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Project deleted.", error: "Couldn't delete the project. Please try again." },
  );
  revalidatePath("/admin/projects");
}

/** Called directly (not as a <form> action) when a card is dropped into a different board column. */
export async function moveProjectStatusAction(id: string, status: "planned" | "ongoing" | "completed") {
  await requireAdmin();
  try {
    await connectToDatabase();
    await Project.findByIdAndUpdate(id, { status });
    await flash("success", `Project moved to ${status}.`);
  } catch (error) {
    console.error("Failed to move project", error);
    await flash("error", "Couldn't move the project. Please try again.");
  }
  revalidatePath("/admin/projects");
}
