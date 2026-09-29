"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { flash, FlashError, withFlash } from "@/lib/flash";
import { sendMail } from "@/lib/mailer";
import { generateCardId } from "@/lib/memberCard";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
  return session;
}

/** Adds a note to the success toast when the notification email could not be sent. */
async function reportMail(sent: boolean, success: string) {
  if (!sent) await flash("error", `${success} But the email to the member could not be sent - check the mail settings.`);
}

export async function approveMemberAction(formData: FormData) {
  const session = await requireAdmin();
  let mailSent = true;
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      const approvedAs = String(formData.get("approvedAs") ?? "");
      const validUntilRaw = String(formData.get("validUntil") ?? "");
      const reviewNote = String(formData.get("reviewNote") ?? "");

      const member = await Member.findById(id);
      if (!member) throw new FlashError("This application no longer exists.");

      const cardId = member.cardId || (await generateCardId());

      member.status = "approved";
      member.approvedAs = approvedAs || member.requestedAs;
      member.validUntil = validUntilRaw ? new Date(validUntilRaw) : undefined;
      member.cardId = cardId;
      member.reviewNote = reviewNote || undefined;
      member.verification = {
        nameMatches: formData.get("nameMatches") === "on",
        affiliationConfirmed: formData.get("affiliationConfirmed") === "on",
        photoSuitable: formData.get("photoSuitable") === "on",
      };
      member.reviewedBy = session.sub;
      member.reviewedAt = new Date();
      await member.save();

      const validText = member.validUntil ? `berlaku sampai ${member.validUntil.toLocaleDateString("id-ID")}` : "tanpa batas waktu";
      const mail = await sendMail({
        to: member.email,
        subject: "AILO Membership Approved - Your Digital Card is Ready",
        text: `Halo ${member.name},\n\nSelamat! Pengajuan keanggotaan AILO Anda sebagai "${member.approvedAs}" telah disetujui.\n\nID kartu: ${cardId}\nMasa berlaku: ${validText}\n\nLihat kartu digital Anda di: /verify/${cardId}\n\nTerima kasih,\nTim AILO`,
      });
      mailSent = mail.sent;
    },
    { success: "Member approved and card issued.", error: "Couldn't approve the member. Please try again." },
  );
  if (ok) await reportMail(mailSent, "Member approved.");
  revalidatePath("/admin/members");
}

export async function rejectMemberAction(formData: FormData) {
  const session = await requireAdmin();
  let mailSent = true;
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const id = String(formData.get("id"));
      const reviewNote = String(formData.get("reviewNote") ?? "");

      const member = await Member.findByIdAndUpdate(
        id,
        { status: "rejected", reviewNote: reviewNote || undefined, reviewedBy: session.sub, reviewedAt: new Date() },
        { new: true },
      );
      if (!member) throw new FlashError("This application no longer exists.");

      const mail = await sendMail({
        to: member.email,
        subject: "AILO Membership Application Update",
        text: `Halo ${member.name},\n\nMohon maaf, pengajuan keanggotaan AILO Anda belum dapat kami setujui saat ini.${
          reviewNote ? `\n\nCatatan dari admin: ${reviewNote}` : ""
        }\n\nAnda dapat mengajukan kembali kapan saja.\n\nTerima kasih,\nTim AILO`,
      });
      mailSent = mail.sent;
    },
    { success: "Application rejected.", error: "Couldn't reject the application. Please try again." },
  );
  if (ok) await reportMail(mailSent, "Application rejected.");
  revalidatePath("/admin/members");
}

export async function revokeMemberAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      await Member.findByIdAndUpdate(String(formData.get("id")), { status: "expired" });
    },
    { success: "Membership revoked.", error: "Couldn't revoke the membership. Please try again." },
  );
  revalidatePath("/admin/members");
}

export async function resendCardEmailAction(formData: FormData) {
  await requireAdmin();
  await withFlash(
    async () => {
      await connectToDatabase();
      const member = await Member.findById(String(formData.get("id")));
      if (!member || member.status !== "approved" || !member.cardId) throw new FlashError("Only approved members have a card to resend.");

      const validText = member.validUntil ? `berlaku sampai ${member.validUntil.toLocaleDateString("id-ID")}` : "tanpa batas waktu";
      const mail = await sendMail({
        to: member.email,
        subject: "Your AILO Digital Member Card",
        text: `Halo ${member.name},\n\nBerikut kembali informasi kartu anggota AILO Anda.\n\nID kartu: ${member.cardId}\nMasa berlaku: ${validText}\n\nLihat kartu digital Anda di: /verify/${member.cardId}\n\nTerima kasih,\nTim AILO`,
      });
      if (!mail.sent) throw new FlashError("The card email could not be sent - check the mail settings.");
    },
    { success: "Card email sent.", error: "Couldn't send the card email. Please try again." },
  );
  revalidatePath("/admin/members");
}
