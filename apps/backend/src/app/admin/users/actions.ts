"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function createUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return;

  await connectToDatabase();
  const passwordHash = await bcrypt.hash(String(formData.get("password")), 12);
  await User.create({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    role: formData.get("role") ?? "admin",
    passwordHash,
  });
  revalidatePath("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const isSelf = session.sub === id;
  const update: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    role: isSelf ? session.role : formData.get("role") ?? "admin",
    isActive: isSelf ? true : formData.get("isActive") === "on",
  };
  const password = String(formData.get("password") ?? "");
  if (password) {
    update.passwordHash = await bcrypt.hash(password, 12);
  }

  await User.findByIdAndUpdate(id, update);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function deleteUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return;
  if (session.sub === String(formData.get("id"))) return;

  await connectToDatabase();
  await User.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/users");
}
