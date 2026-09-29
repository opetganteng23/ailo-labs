"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function profilesFromForm(formData: FormData) {
  return {
    linkedin: String(formData.get("linkedin") ?? "") || undefined,
    orcid: String(formData.get("orcid") ?? "") || undefined,
    googleScholar: String(formData.get("googleScholar") ?? "") || undefined,
    sinta: String(formData.get("sinta") ?? "") || undefined,
    scopus: String(formData.get("scopus") ?? "") || undefined,
  };
}

export async function createTeamAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const name = String(formData.get("name") ?? "").trim();
  await Team.create({
    name,
    slug: slugify(name),
    position: String(formData.get("position") ?? ""),
    category: String(formData.get("category") ?? "Peneliti"),
    jenjang: String(formData.get("jenjang") ?? "") || undefined,
    studyProgram: String(formData.get("studyProgram") ?? "") || undefined,
    displayOrder: Number(formData.get("displayOrder") ?? 0) || 0,
    bio: String(formData.get("bio") ?? ""),
    email: String(formData.get("email") ?? "") || undefined,
    photo: String(formData.get("photo") ?? "") || undefined,
    profiles: profilesFromForm(formData),
  });
  revalidatePath("/admin/team");
  redirect("/admin/team");
}

export async function updateTeamAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  await Team.findByIdAndUpdate(id, {
    name: String(formData.get("name") ?? "").trim(),
    position: String(formData.get("position") ?? ""),
    category: String(formData.get("category") ?? "Peneliti"),
    jenjang: String(formData.get("jenjang") ?? "") || undefined,
    studyProgram: String(formData.get("studyProgram") ?? "") || undefined,
    displayOrder: Number(formData.get("displayOrder") ?? 0) || 0,
    bio: String(formData.get("bio") ?? ""),
    email: String(formData.get("email") ?? "") || undefined,
    photo: String(formData.get("photo") ?? "") || undefined,
    profiles: profilesFromForm(formData),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  redirect("/admin/team");
}

export async function deleteTeamAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  await Team.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/team");
}
