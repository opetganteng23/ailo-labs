"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
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

export type ReplyState = { status: "idle" | "sent" | "error"; message?: string; to?: string; sentAt?: string };

/** Used with useActionState so the reply box can show sending / sent / failed (§5). */
export async function replyMessageAction(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return { status: "error", message: "Your session has expired. Sign in again." };

  const id = String(formData.get("id"));
  const to = String(formData.get("to"));
  const subject = String(formData.get("subject"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { status: "error", message: "Tulis balasan terlebih dahulu." };

  try {
    const mail = await sendMail({ to, subject: `Re: ${subject}`, text: body });
    if (!mail.sent) return { status: "error", message: "Reply gagal dikirim. Email tidak dapat dikirim - periksa pengaturan email, lalu coba kembali." };

    const sentAt = new Date();
    await connectToDatabase();
    await ContactMessage.findByIdAndUpdate(id, {
      isRead: true,
      repliedAt: sentAt,
      $push: { replies: { body, sentAt, sentBy: session.name, to } },
    });
    revalidatePath("/admin/messages");
    return { status: "sent", to, sentAt: sentAt.toISOString() };
  } catch (error) {
    console.error("Failed to send reply", error);
    return { status: "error", message: "Reply gagal dikirim. Silakan coba kembali." };
  }
}
