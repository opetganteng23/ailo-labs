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
  if (!title || !description) throw new FlashError(`Please fill in the ${[!title && "title", !description && "summary"].filter(Boolean).join(" and ")}.`, "warning");
  return {
    title,
    description,
    content: sanitizeRichText(String(formData.get("content") ?? ""), { trusted: true }),
    status: formData.get("status") ?? "planned",
    images: formData.get("image") ? [String(formData.get("image"))] : [],
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

export async function createProjectAction(formData: FormData) {
  await requireAdmin();
  const ok = await withFlash(
    async () => {
      const data = readProject(formData);
      const manualDate = readManualDate(formData);
      await connectToDatabase();
      await Project.create({ ...data, slug: slugify(data.title), publishedAt: manualDate ?? new Date(), publishedAtManual: isManualDate(formData) });
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
      const manualDate = readManualDate(formData);
      await connectToDatabase();
      const existing = await Project.findById(id).lean<{ publishedAt?: Date; publishStatus?: string }>();
      if (!existing) throw new FlashError("This project no longer exists.");
      // An admin saving a lecturer's submission publishes it.
      await Project.findByIdAndUpdate(id, {
        ...data,
        publishStatus: existing.publishStatus === "archived" ? "archived" : "published",
        publishedAt: manualDate ?? existing.publishedAt ?? new Date(),
        publishedAtManual: isManualDate(formData),
      });
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

/** Publishes a project a lecturer submitted for review. */
export async function publishProjectAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      await Project.findByIdAndUpdate(String(formData.get("id")), { publishStatus: "published" });
    },
    { success: "Project published.", error: "Couldn't publish the project. Please try again." },
  );
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
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

/** Archives a project (hides it from the public site, keeps it) or restores it. */
export async function setProjectArchivedAction(formData: FormData) {
  await requireAdmin();
  const archive = formData.get("archive") === "1";
  await withFlash(
    async () => {
      await connectToDatabase();
      await Project.findByIdAndUpdate(String(formData.get("id")), { publishStatus: archive ? "archived" : "published" });
    },
    { success: archive ? "Project archived." : "Project restored.", error: "Couldn't update the project. Please try again." },
  );
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
}
