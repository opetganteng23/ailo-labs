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

export async function deleteUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return;
  if (session.sub === String(formData.get("id"))) return;

  await connectToDatabase();
  await User.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/users");
}
