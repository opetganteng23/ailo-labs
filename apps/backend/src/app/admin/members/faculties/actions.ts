"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { MemberFaculty } from "@/models/MemberFaculty";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

function readName(value: FormDataEntryValue | null) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!name) throw new FlashError("Faculty name is required.", "warning");
  if (name.length > 80) throw new FlashError("Faculty name must be 80 characters or fewer.", "warning");
  return name;
}

async function assertUnique(name: string, exceptId?: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = await MemberFaculty.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } }).lean<{ _id: unknown }>();
  if (existing && String(existing._id) !== exceptId) throw new FlashError(`"${name}" already exists.`, "warning");
}

function refresh() {
  revalidatePath("/admin/members/faculties");
  revalidatePath("/admin/members");
}

export async function createMemberFacultyAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const name = readName(formData.get("name"));
      await connectToDatabase();
      await assertUnique(name);
      const order = await MemberFaculty.countDocuments();
      await MemberFaculty.create({ name, order });
    },
    { success: "Faculty added.", error: "Couldn't add the faculty. Please try again." },
  );
  refresh();
}

export async function renameMemberFacultyAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const id = String(formData.get("id"));
      const name = readName(formData.get("name"));
      await connectToDatabase();
      await assertUnique(name, id);
      const current = await MemberFaculty.findById(id);
      if (!current) throw new FlashError("That faculty no longer exists.");
      const oldName = current.name as string;
      current.name = name;
      await current.save();
      await Member.updateMany({ faculty: oldName }, { faculty: name });
    },
    { success: "Faculty renamed.", error: "Couldn't rename the faculty. Please try again." },
  );
  refresh();
}

export async function deleteMemberFacultyAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      const faculty = await MemberFaculty.findById(id).lean<{ name: string }>();
      if (!faculty) return;
      const inUse = await Member.countDocuments({ faculty: faculty.name });
      if (inUse > 0) {
        throw new FlashError(`"${faculty.name}" is still used by ${inUse} member${inUse === 1 ? "" : "s"}. Move them to another faculty first.`, "warning");
      }
      await MemberFaculty.findByIdAndDelete(id);
    },
    { success: "Faculty deleted.", error: "Couldn't delete the faculty. Please try again." },
  );
  refresh();
}
