"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdminRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createProjectAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const title = String(formData.get("title") ?? "").trim();
  await Project.create({
    title,
    slug: slugify(title),
    description: String(formData.get("description") ?? ""),
    content: String(formData.get("content") ?? ""),
    status: formData.get("status") ?? "planned",
    images: formData.get("image") ? [String(formData.get("image"))] : [],
  });
  revalidatePath("/admin/projects");
}

export async function updateProjectAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  await Project.findByIdAndUpdate(id, {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    content: String(formData.get("content") ?? ""),
    status: formData.get("status") ?? "planned",
    images: formData.get("image") ? [String(formData.get("image"))] : [],
  });
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
}

export async function deleteProjectAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  await Project.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/projects");
}
