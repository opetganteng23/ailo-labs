"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import crypto from "node:crypto";

import { getSession, isAdminRole } from "@/lib/auth";
import { flash, FlashError, withFlash } from "@/lib/flash";
import { provisionDosenAccount } from "@/lib/dosenAccount";
import { sendMail } from "@/lib/mailer";
import { listTeamCategories } from "@/lib/teamCategoriesDb";
import { generateCardId } from "@/lib/memberCard";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { Team } from "@/models/Team";

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
  let dosenNote = "";
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

      if (member.approvedAs === "Dosen") {
        const account = await provisionDosenAccount(member);
        dosenNote = account.skipped
          ? `No dosen account created (${account.skipped}).`
          : `${account.created ? "Dosen account created" : "Account upgraded to dosen"}${account.mailSent ? "; a set-password link was emailed." : ", but the set-password email could not be sent."}`;
      }
    },
    { success: "Member approved and card issued.", error: "Couldn't approve the member. Please try again." },
  );
  if (ok) await reportMail(mailSent, "Member approved.");
  if (ok && dosenNote) await flash(dosenNote.includes("could not") ? "error" : "success", dosenNote);
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

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Admin-only control over who appears on the public Team page (§12-14 of the
 * eval doc). Only approved members are eligible. Turning it on creates or
 * reuses that member's Team profile and makes it public; turning it off just
 * hides the profile again (isActive: false) without deleting anything a
 * lecturer or admin may have already filled in.
 */
export async function setMemberTeamBoardAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const include = formData.get("include") === "on";
  const category = String(formData.get("teamCategory") ?? "");

  await withFlash(
    async () => {
      await connectToDatabase();
      const member = await Member.findById(id);
      if (!member) throw new FlashError("This member no longer exists.");
      if (member.status !== "approved") throw new FlashError("Only approved members can be added to the Team Board.");
      if (include && !(await listTeamCategories()).includes(category)) {
        throw new FlashError("Choose a category for the Team Board.");
      }

      member.includeInTeamBoard = include;
      if (include) member.teamCategory = category;
      await member.save();

      let team = await Team.findOne({ member: member._id }).catch(() => null);
      if (!team) team = await Team.findOne({ email: member.email.toLowerCase() });

      if (!include) {
        // Leave the profile in place (a lecturer's edits, Scopus data, etc. aren't lost) - just hide it.
        if (team) {
          team.isActive = false;
          await team.save();
        }
        return;
      }

      if (team) {
        team.category = category;
        team.isActive = true;
        team.member = member._id;
        if (!team.photo && member.photo) team.photo = member.photo;
        await team.save();
      } else {
        let slug = slugify(member.name) || "member";
        if (await Team.exists({ slug })) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
        await Team.create({
          name: member.name,
          slug,
          position: member.approvedAs ?? member.requestedAs,
          category,
          email: member.email.toLowerCase(),
          photo: member.photo,
          member: member._id,
          isActive: true,
        });
      }
    },
    {
      success: include ? "Added to the Team Board." : "Removed from the Team Board.",
      error: "Couldn't update the Team Board. Please try again.",
    },
  );
  revalidatePath("/admin/members");
  revalidatePath("/admin/team");
  revalidatePath("/team");
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
