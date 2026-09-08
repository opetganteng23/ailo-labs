"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createTeamAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  const name = String(formData.get("name") ?? "").trim();
  await Team.create({
    name,
    slug: slugify(name),
    position: String(formData.get("position") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    email: String(formData.get("email") ?? "") || undefined,
  });
  revalidatePath("/admin/team");
}

export async function deleteTeamAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  await connectToDatabase();
  await Team.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/team");
}
