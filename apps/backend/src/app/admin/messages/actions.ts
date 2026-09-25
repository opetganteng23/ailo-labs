"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdminRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

export async function markMessageReadAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const isRead = formData.get("isRead") === "true";
  await ContactMessage.findByIdAndUpdate(id, { isRead });
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  await ContactMessage.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/messages");
}
