"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { User } from "@/models/User";

const STAFF_ROLES = ["admin", "staff_lab", "super_admin"];

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/admin/dashboard?error=forbidden");
  return session;
}

function readRole(formData: FormData) {
  const role = String(formData.get("role") ?? "admin");
  return STAFF_ROLES.includes(role) ? role : "admin";
}

function readPassword(formData: FormData, required: boolean) {
  const password = String(formData.get("password") ?? "");
  if (required && !password) throw new FlashError("Please set a password.");
  if (password && password.length < 8) throw new FlashError("The password must be at least 8 characters.");
  return password;
}

export async function createUserAction(formData: FormData) {
  await requireSuperAdmin();
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const role = readRole(formData);

      if (formData.get("mode") === "member") {
        const member = await Member.findById(String(formData.get("memberId") ?? "")).lean<{
          _id: unknown;
          name: string;
          email: string;
          photo?: string;
          status: string;
        }>();
        if (!member || member.status !== "approved") throw new FlashError("Pick an approved member from the list.");

        const email = member.email.toLowerCase();
        const existing = await User.findOne({ email });
        const password = readPassword(formData, !existing);
        if (existing) {
          // A member who registered already has a borrower account: upgrade it.
          existing.role = role;
          existing.photo = existing.photo || member.photo;
          existing.member = member._id;
          existing.isActive = true;
          if (password) existing.passwordHash = await bcrypt.hash(password, 12);
          await existing.save();
          return;
        }
        await User.create({
          name: member.name,
          email,
          role,
          photo: member.photo,
          member: member._id,
          passwordHash: await bcrypt.hash(password, 12),
        });
        return;
      }

      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").toLowerCase().trim();
      if (!name || !email) throw new FlashError(`Please fill in the ${[!name && "name", !email && "email"].filter(Boolean).join(" and ")}.`);
      if (await User.exists({ email })) throw new FlashError("An account with this email already exists. Edit that user instead.");
      await User.create({
        name,
        email,
        role,
        photo: String(formData.get("photo") ?? "") || undefined,
        passwordHash: await bcrypt.hash(readPassword(formData, true), 12),
      });
    },
    { success: "User created.", error: "Couldn't create the user. Please try again." },
  );
  revalidatePath("/admin/users");
  if (ok) redirect("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = String(formData.get("id"));
  const ok = await withFlash(
    async () => {
      const isSelf = session.sub === id;
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").toLowerCase().trim();
      if (!name || !email) throw new FlashError(`Please fill in the ${[!name && "name", !email && "email"].filter(Boolean).join(" and ")}.`);

      await connectToDatabase();
      const clash = await User.findOne({ email, _id: { $ne: id } }).lean();
      if (clash) throw new FlashError("Another account already uses this email.");

      const update: Record<string, unknown> = {
        name,
        email,
        photo: String(formData.get("photo") ?? "") || undefined,
        role: isSelf ? session.role : readRole(formData),
        isActive: isSelf ? true : formData.get("isActive") === "on",
      };
      const password = readPassword(formData, false);
      if (password) update.passwordHash = await bcrypt.hash(password, 12);

      await User.findByIdAndUpdate(id, update);
    },
    { success: "Changes saved.", error: "Couldn't save your changes. Please try again." },
  );
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  if (ok) redirect("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const id = String(formData.get("id"));
  await withFlash(
    async () => {
      if (session.sub === id) throw new FlashError("You can't delete your own account.");
      await connectToDatabase();
      await User.findByIdAndDelete(id);
    },
    { success: "User deleted.", error: "Couldn't delete the user. Please try again." },
  );
  revalidatePath("/admin/users");
}
