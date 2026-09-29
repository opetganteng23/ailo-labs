"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdminRole } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
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

export async function archiveMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const archived = formData.get("archived") === "true";
  await ContactMessage.findByIdAndUpdate(id, { archived, isRead: true });
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  await ContactMessage.findByIdAndDelete(String(formData.get("id")));
  revalidatePath("/admin/messages");
}

export async function replyMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const to = String(formData.get("to"));
  const subject = String(formData.get("subject"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await sendMail({ to, subject: `Re: ${subject}`, text: body });
  await ContactMessage.findByIdAndUpdate(id, { isRead: true, repliedAt: new Date() });
  revalidatePath("/admin/messages");
}
