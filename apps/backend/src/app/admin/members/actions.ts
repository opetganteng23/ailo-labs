"use server";

import { revalidatePath } from "next/cache";

import { getSession, isAdminRole } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { generateCardId } from "@/lib/memberCard";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";

export async function approveMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const approvedAs = String(formData.get("approvedAs") ?? "");
  const validUntilRaw = String(formData.get("validUntil") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "");

  const member = await Member.findById(id);
  if (!member) return;

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
  await sendMail({
    to: member.email,
    subject: "AILO Membership Approved - Your Digital Card is Ready",
    text: `Halo ${member.name},\n\nSelamat! Pengajuan keanggotaan AILO Anda sebagai "${member.approvedAs}" telah disetujui.\n\nID kartu: ${cardId}\nMasa berlaku: ${validText}\n\nLihat kartu digital Anda di: /verify/${cardId}\n\nTerima kasih,\nTim AILO`,
  });

  revalidatePath("/admin/members");
}

export async function rejectMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const reviewNote = String(formData.get("reviewNote") ?? "");

  const member = await Member.findByIdAndUpdate(
    id,
    { status: "rejected", reviewNote: reviewNote || undefined, reviewedBy: session.sub, reviewedAt: new Date() },
    { new: true },
  );
  if (!member) return;

  await sendMail({
    to: member.email,
    subject: "AILO Membership Application Update",
    text: `Halo ${member.name},\n\nMohon maaf, pengajuan keanggotaan AILO Anda belum dapat kami setujui saat ini.${
      reviewNote ? `\n\nCatatan dari admin: ${reviewNote}` : ""
    }\n\nAnda dapat mengajukan kembali kapan saja.\n\nTerima kasih,\nTim AILO`,
  });

  revalidatePath("/admin/members");
}

export async function revokeMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  await Member.findByIdAndUpdate(id, { status: "expired" });
  revalidatePath("/admin/members");
}

export async function resendCardEmailAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return;

  await connectToDatabase();
  const id = String(formData.get("id"));
  const member = await Member.findById(id);
  if (!member || member.status !== "approved" || !member.cardId) return;

  const validText = member.validUntil ? `berlaku sampai ${member.validUntil.toLocaleDateString("id-ID")}` : "tanpa batas waktu";
  await sendMail({
    to: member.email,
    subject: "Your AILO Digital Member Card",
    text: `Halo ${member.name},\n\nBerikut kembali informasi kartu anggota AILO Anda.\n\nID kartu: ${member.cardId}\nMasa berlaku: ${validText}\n\nLihat kartu digital Anda di: /verify/${member.cardId}\n\nTerima kasih,\nTim AILO`,
  });

  revalidatePath("/admin/members");
}
