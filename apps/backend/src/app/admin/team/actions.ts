"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { Team } from "@/models/Team";
import { readCategories } from "@/lib/teamCats";
import { readWorksFromForm } from "@/lib/teamWorks";

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
  if (!name || !position) throw new FlashError(`Please fill in the ${[!name && "name", !position && "position"].filter(Boolean).join(" and ")}.`, "warning");
  const categories = readCategories(formData);
  if (categories.length === 0) throw new FlashError("Choose at least one category.", "warning");
  return {
    name,
    position,
    category: categories[0],
    categories,
    jenjang: String(formData.get("jenjang") ?? "") || undefined,
    studyProgram: String(formData.get("studyProgram") ?? "") || undefined,
    referee: String(formData.get("referee") ?? "").trim().slice(0, 160) || undefined,
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
    works: readWorksFromForm(formData),
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
      const isActive = formData.get("isActive") === "on";
      await connectToDatabase();
      const team = await Team.findByIdAndUpdate(id, { ...data, isActive });
      // Keep Admin -> Members' "Include in Team Board" checkbox in sync either way.
      if (team?.member) await Member.findByIdAndUpdate(team.member, { includeInTeamBoard: isActive });
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  revalidatePath("/admin/members");
  revalidatePath("/team");
  if (ok) redirect("/admin/team");
}

export async function deleteTeamAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const team = await Team.findByIdAndDelete(String(formData.get("id")));
      // Keep Admin -> Members in sync if this profile came from "Include in Team Board".
      if (team?.member) await Member.findByIdAndUpdate(team.member, { includeInTeamBoard: false });
    },
    { success: "Team member deleted.", error: "Couldn't delete the team member. Please try again." },
  );
  revalidatePath("/admin/team");
  revalidatePath("/admin/members");
}

/** Applies the profile edits a lecturer submitted from the dosen dashboard and publishes the profile. */
export async function approveTeamChangesAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await withFlash(
    async () => {
      await connectToDatabase();
      const team = await Team.findById(id);
      if (!team?.pendingChanges) throw new FlashError("There are no changes waiting for this profile.");
      const changes = team.pendingChanges as Record<string, unknown>;
      for (const [k, v] of Object.entries(changes)) {
        team.set(k, v === "" ? undefined : v);
      }
      team.pendingChanges = undefined;
      team.pendingSince = undefined;
      team.isActive = true;
      await team.save();
    },
    { success: "Profile changes approved and published.", error: "Couldn't approve the changes. Please try again." },
  );
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  revalidatePath("/team");
}

export async function rejectTeamChangesAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await withFlash(
    async () => {
      await connectToDatabase();
      await Team.findByIdAndUpdate(id, { $unset: { pendingChanges: 1, pendingSince: 1 } });
    },
    { success: "Profile changes discarded.", error: "Couldn't discard the changes. Please try again." },
  );
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
}
