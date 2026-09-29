"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
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

function readMember(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  if (!name || !position) throw new FlashError(`Please fill in the ${[!name && "name", !position && "position"].filter(Boolean).join(" and ")}.`);
  return {
    name,
    position,
    category: String(formData.get("category") ?? "Peneliti"),
    jenjang: String(formData.get("jenjang") ?? "") || undefined,
    studyProgram: String(formData.get("studyProgram") ?? "") || undefined,
    displayOrder: Number(formData.get("displayOrder") ?? 0) || 0,
    bio: String(formData.get("bio") ?? ""),
    researchInterests: String(formData.get("researchInterests") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12),
    email: String(formData.get("email") ?? "") || undefined,
    photo: String(formData.get("photo") ?? "") || undefined,
    profiles: profilesFromForm(formData),
  };
}

export async function createTeamAction(formData: FormData) {
  await requireAdmin();
  const ok = await withFlash(
    async () => {
      const data = readMember(formData);
      await connectToDatabase();
      await Team.create({ ...data, slug: slugify(data.name) });
    },
    { success: "Team member added.", error: "Couldn't add the team member. Please try again." },
  );
  revalidatePath("/admin/team");
  if (ok) redirect("/admin/team");
}

export async function updateTeamAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const ok = await withFlash(
    async () => {
      const data = readMember(formData);
      await connectToDatabase();
      await Team.findByIdAndUpdate(id, { ...data, isActive: formData.get("isActive") === "on" });
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  if (ok) redirect("/admin/team");
}

export async function deleteTeamAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      await Team.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Team member deleted.", error: "Couldn't delete the team member. Please try again." },
  );
  revalidatePath("/admin/team");
}
