"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { FlashError, withFlash } from "@/lib/flash";
import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
}

export async function markMessageReadAction(formData: FormData) {
  await requireAdmin();
  const isRead = formData.get("isRead") === "true";
  await withFlash(
    async () => {
      await connectToDatabase();
      await ContactMessage.findByIdAndUpdate(String(formData.get("id")), { isRead });
    },
    { success: isRead ? "Marked as read." : "Marked as unread.", error: "Couldn't update the message. Please try again." },
  );
  revalidatePath("/admin/messages");
}

export async function archiveMessageAction(formData: FormData) {
  await requireAdmin();
  const archived = formData.get("archived") === "true";
  await withFlash(
    async () => {
      await connectToDatabase();
      await ContactMessage.findByIdAndUpdate(String(formData.get("id")), { archived, isRead: true });
    },
    { success: archived ? "Message archived." : "Message moved back to the inbox.", error: "Couldn't update the message. Please try again." },
  );
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      await ContactMessage.findByIdAndDelete(String(formData.get("id")));
    },
    { success: "Message deleted.", error: "Couldn't delete the message. Please try again." },
  );
  revalidatePath("/admin/messages");
}

export async function replyMessageAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      const id = String(formData.get("id"));
      const to = String(formData.get("to"));
      const subject = String(formData.get("subject"));
      const body = String(formData.get("body") ?? "").trim();
      if (!body) throw new FlashError("Write a reply before sending.");

      const mail = await sendMail({ to, subject: `Re: ${subject}`, text: body });
      if (!mail.sent) throw new FlashError("The reply could not be sent - check the mail settings.");
      await connectToDatabase();
      await ContactMessage.findByIdAndUpdate(id, { isRead: true, repliedAt: new Date() });
    },
    { success: "Reply sent.", error: "Couldn't send the reply. Please try again." },
  );
  revalidatePath("/admin/messages");
}
