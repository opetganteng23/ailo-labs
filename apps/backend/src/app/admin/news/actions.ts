"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDraftFromFiveW1H } from "@/lib/newsDraft";
import { News } from "@/models/News";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  if (!session) redirect("/admin/login");

  await connectToDatabase();
  const title = String(formData.get("title") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  await News.create({
    title,
    slug: slugify(title),
    summary: String(formData.get("summary") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    category: String(formData.get("category") ?? "General").trim(),
    status,
    publishedAt: status === "published" ? new Date() : undefined,
    author: session.sub,
    images: formData.get("image") ? [String(formData.get("image"))] : [],
    source5W1H: {
      what: formData.get("what"),
      who: formData.get("who"),
      when: formData.get("when"),
      where: formData.get("where"),
      why: formData.get("why"),
      how: formData.get("how"),
    },
  });

  revalidatePath("/admin/news");
  redirect("/admin/news");
}

export async function deleteNewsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  await connectToDatabase();
  await News.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/news");
}
