"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createResearchAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  const title = String(formData.get("title") ?? "").trim();
  await Research.create({
    title,
    slug: slugify(title),
    description: String(formData.get("description") ?? ""),
    content: String(formData.get("content") ?? ""),
    status: formData.get("status") === "published" ? "published" : "draft",
    image: String(formData.get("image") ?? "") || undefined,
  });
  revalidatePath("/admin/research");
}

export async function updateResearchAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  await Research.findByIdAndUpdate(id, {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    content: String(formData.get("content") ?? ""),
    status: formData.get("status") === "published" ? "published" : "draft",
    image: String(formData.get("image") ?? "") || undefined,
  });
  revalidatePath("/admin/research");
  revalidatePath(`/admin/research/${id}`);
}

export async function deleteResearchAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  await Research.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/research");
}
