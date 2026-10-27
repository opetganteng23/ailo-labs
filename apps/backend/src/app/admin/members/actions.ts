"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/lib/auth";
import { getBaseUrl } from "@/lib/baseUrl";
import { flash, FlashError, withFlash } from "@/lib/flash";
import { provisionDosenAccount } from "@/lib/dosenAccount";
import { sendMail } from "@/lib/mailer";
import { listTeamCategories } from "@/lib/teamCategoriesDb";
import { generateCardId } from "@/lib/memberCard";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import { categoriesOf, readCategories } from "@/lib/teamCats";
import { syncMemberTeamBoard, teamCategoryFor } from "@/lib/teamBoardSync";
import { MEMBER_CATEGORIES } from "@/lib/memberCategories";
import { findDuplicateMember } from "@/lib/memberDuplicate";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin/login");
  return session;
}

/** Adds a note to the success toast when the notification email could not be sent. */
async function reportMail(sent: boolean, success: string) {
  if (!sent) await flash("error", `${success} But the email to the member could not be sent - check the mail settings.`);
}

/** The card's "valid until" date is mandatory: a card without an expiry is never issued. */
function readValidUntil(raw: string, options: { mustBeFuture?: boolean } = {}): Date {
  const value = raw.trim();
  if (!value) throw new FlashError("Fill in the card's valid-until date first.", "warning");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new FlashError("The valid-until date is not a valid date.", "warning");
  if (options.mustBeFuture && date.getTime() < Date.now() - 24 * 60 * 60 * 1000) throw new FlashError("The valid-until date must be today or later.", "warning");
  return date;
}

/**
 * Gives the member a card id and saves. Done in a retry loop: if two approvals race each other,
 * both can compute the same "next" id before either saves and the second trips the unique index;
 * retrying with a freshly-computed id resolves it without the admin seeing an error.
 */
async function saveWithCardId(member: InstanceType<typeof Member>): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const cardId = member.cardId || (await generateCardId());
    member.cardId = cardId;
    try {
      await member.save();
      return cardId;
    } catch (error) {
      const isDuplicateCardId = (error as { code?: number })?.code === 11000;
      if (!isDuplicateCardId || attempt >= 4) throw error;
      member.cardId = undefined;
    }
  }
}

function cardEmailText(member: { name: string }, intro: string, cardId: string, validUntil: Date | undefined, cardUrl: string) {
  const validText = validUntil ? `berlaku sampai ${validUntil.toLocaleDateString("id-ID")}` : "tanpa batas waktu";
  return `Halo ${member.name},

${intro}

ID kartu: ${cardId}
Masa berlaku: ${validText}

Lihat kartu digital Anda di: ${cardUrl}

Buka tautan itu untuk melihat kartu digital Anda (nama, foto, masa berlaku, dan kode QR). Simpan tautan atau tangkapan layarnya agar mudah ditunjukkan kapan saja. Jika Anda memerlukan kartu cetak, silakan hubungi admin AILO.

Terima kasih,
Tim AILO`;
}

/** Lecturer account note for the success toast. */
function dosenNoteOf(account: { created: boolean; mailSent: boolean; skipped?: string }) {
  return account.skipped
    ? `No dosen account created (${account.skipped}).`
    : `${account.created ? "Dosen account created" : "Account upgraded to dosen"}${account.mailSent ? "; a set-password link was emailed." : ", but the set-password email could not be sent."}`;
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

      const validUntil = readValidUntil(validUntilRaw, { mustBeFuture: true });

      const faculty = String(formData.get("faculty") ?? "").trim();

      member.status = "approved";
      member.approvedAs = approvedAs || member.requestedAs;
      member.validUntil = validUntil;
      member.reviewNote = reviewNote || undefined;
      if (faculty) member.faculty = faculty;
      member.verification = {
        nameMatches: formData.get("nameMatches") === "on",
        affiliationConfirmed: formData.get("affiliationConfirmed") === "on",
        photoSuitable: formData.get("photoSuitable") === "on",
      };
      member.reviewedBy = session.sub;
      member.reviewedAt = new Date();

      const cardId = await saveWithCardId(member);

      // Member decided at registration whether their name/profile should go public once
      // approved ("Show my name and profile links on the AILO website once approved" -
      // optional, unchecked by default). If they opted in, approval is also the moment
      // they appear on the public Team page - no separate admin step needed. Their
      // approved membership type doubles as the Team category (both use the same list).
      // An admin can still remove them again from Admin > Members afterwards.
      if (member.showProfilePublicly && !member.includeInTeamBoard) {
        const category = teamCategoryFor(member.approvedAs || member.requestedAs, member.studyLevel, await listTeamCategories());
        member.includeInTeamBoard = true;
        member.teamCategory = category;
        member.teamCategories = [category];
        await member.save();
        await syncMemberTeamBoard(member, { include: true, categories: [category] });
      }

      const validText = `berlaku sampai ${validUntil.toLocaleDateString("id-ID")}`;
      const cardUrl = `${await getBaseUrl()}/verify/${cardId}`;
      const mail = await sendMail({
        to: member.email,
        subject: "AILO Membership Approved - Your Digital Card is Ready",
        text: `Halo ${member.name},\n\nSelamat! Pengajuan keanggotaan AILO Anda sebagai "${member.approvedAs}" telah disetujui.\n\nID kartu: ${cardId}\nMasa berlaku: ${validText}\n\nLihat kartu digital Anda di: ${cardUrl}\n\nBuka tautan itu untuk melihat kartu digital Anda (nama, foto, masa berlaku, dan kode QR). Simpan tautan atau tangkapan layarnya agar mudah ditunjukkan kapan saja. Jika Anda memerlukan kartu cetak, silakan hubungi admin AILO.\n\nTerima kasih,\nTim AILO`,
      });
      mailSent = mail.sent;

      if (member.approvedAs === "Dosen") {
        dosenNote = dosenNoteOf(await provisionDosenAccount(member));
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
  const categories = readCategories(formData, "teamCategories");

  await withFlash(
    async () => {
      await connectToDatabase();
      const member = await Member.findById(id);
      if (!member) throw new FlashError("This member no longer exists.");
      if (member.status !== "approved") throw new FlashError("Only approved members can be added to the Team Board.");
      const allowed = await listTeamCategories();
      if (include && (categories.length === 0 || categories.some((c) => !allowed.includes(c)))) {
        throw new FlashError("Choose at least one category for the Team Board.");
      }

      member.includeInTeamBoard = include;
      if (include) {
        member.teamCategory = categories[0];
        member.teamCategories = categories;
      }
      await member.save();

      await syncMemberTeamBoard(member, { include, categories });
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

      const cardUrl = `${await getBaseUrl()}/verify/${member.cardId}`;
      const mail = await sendMail({
        to: member.email,
        subject: "Your AILO Digital Member Card",
        text: cardEmailText(member, "Berikut kembali informasi kartu anggota AILO Anda.", member.cardId, member.validUntil, cardUrl),
      });
      if (!mail.sent) throw new FlashError("The card email could not be sent - check the mail settings.");
    },
    { success: "Card email sent.", error: "Couldn't send the card email. Please try again." },
  );
  revalidatePath("/admin/members");
}

/**
 * Keeps the lecturer login and the Team profile in step when an admin changes a member's category.
 * Moving someone away from "Dosen" switches their lecturer account off (members have no login of their own);
 * moving someone to "Dosen" creates the account. Returns a note for the toast, or "".
 */
async function syncAfterCategoryChange(
  member: InstanceType<typeof Member>,
  before: { category: string; level?: string },
  after: { category: string; level?: string },
): Promise<string> {
  const allowed = await listTeamCategories();
  const oldTeamCat = teamCategoryFor(before.category, before.level, allowed);
  const newTeamCat = teamCategoryFor(after.category, after.level, allowed);

  // Team Board profile: swap the old category for the new one, leave any others the admin ticked.
  const swap = (list: string[]) => {
    const kept = list.filter((c) => c !== oldTeamCat && c !== before.category);
    return Array.from(new Set([...(list.length === 0 || kept.length !== list.length ? [newTeamCat] : []), ...kept]));
  };
  if (oldTeamCat !== newTeamCat) {
    const profiles = await Team.find({ $or: [{ member: member._id }, { email: member.email }] });
    for (const team of profiles) {
      const cats = swap(categoriesOf(team));
      team.categories = cats;
      team.category = cats[0];
      if (team.position === before.category) team.position = after.category;
      await team.save();
    }
    if (member.includeInTeamBoard) {
      const cats = swap(member.teamCategories?.length ? member.teamCategories : member.teamCategory ? [member.teamCategory] : []);
      member.teamCategories = cats;
      member.teamCategory = cats[0];
      await member.save();
    }
  }

  if (before.category === "Dosen" && after.category !== "Dosen") {
    const user = await User.findOne({ $or: [{ member: member._id }, { email: member.email.toLowerCase() }] });
    if (user && user.role === "dosen") {
      user.role = "borrower";
      user.isActive = false;
      await user.save();
      return "The lecturer account was switched off because the member is no longer a Dosen.";
    }
  }
  if (before.category !== "Dosen" && after.category === "Dosen") return dosenNoteOf(await provisionDosenAccount(member));
  return "";
}

/** Admin edit of an issued member: contact details, category, photo and the card's valid-until date. The card id never changes. */
export async function updateMemberAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  let note = "";
  await withFlash(
    async () => {
      await connectToDatabase();
      const member = await Member.findById(id);
      if (!member) throw new FlashError("This member no longer exists.");

      const name = String(formData.get("name") ?? "").trim();
      const affiliation = String(formData.get("affiliation") ?? "").trim();
      const approvedAs = String(formData.get("approvedAs") ?? "");
      if (!name || !affiliation) throw new FlashError(`Please fill in the ${[!name && "name", !affiliation && "affiliation"].filter(Boolean).join(" and ")}.`, "warning");
      if (!(MEMBER_CATEGORIES as readonly string[]).includes(approvedAs)) throw new FlashError("Choose a valid member category.", "warning");
      const validUntil = readValidUntil(String(formData.get("validUntil") ?? ""));

      const before = { category: (member.approvedAs ?? member.requestedAs) as string, level: member.studyLevel as string | undefined };
      const photo = String(formData.get("photo") ?? "");
      const referee = String(formData.get("referee") ?? "").trim().slice(0, 160);
      member.name = name;
      member.affiliation = affiliation;
      member.phone = String(formData.get("phone") ?? "").trim() || undefined;
      member.approvedAs = approvedAs;
      member.validUntil = validUntil;
      member.photo = photo || undefined;
      member.faculty = String(formData.get("faculty") ?? "").trim() || undefined;
      member.studyLevel = String(formData.get("studyLevel") ?? "").trim() || undefined;
      member.referee = referee || undefined;
      await member.save();

      // Keep the linked Team Board profile in step with the member's name, photo and referee.
      await Team.updateMany({ member: member._id }, { name, photo: photo || undefined, referee: referee || undefined });

      note = await syncAfterCategoryChange(member, before, { category: approvedAs, level: member.studyLevel });
    },
    { success: "Member updated.", error: "Couldn't update the member. Please try again." },
  );
  if (note) await flash(note.includes("could not") ? "error" : "info", note);
  revalidatePath("/admin/members");
  revalidatePath("/admin/team");
  revalidatePath("/admin/users");
  revalidatePath("/team");
}

/**
 * Admin adds a member directly: the card is issued straight away and emailed to the address entered,
 * with no application to review. A lecturer also gets a dosen account (set-password link by email).
 */
export async function createMemberAction(formData: FormData) {
  const session = await requireAdmin();
  let createdId = "";
  const notes: { type: "success" | "error"; text: string }[] = [];
  const ok = await withFlash(
    async () => {
      await connectToDatabase();
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const affiliation = String(formData.get("affiliation") ?? "").trim();
      const approvedAs = String(formData.get("approvedAs") ?? "");
      if (!name || !email || !affiliation) {
        throw new FlashError(`Please fill in the ${[!name && "name", !email && "email", !affiliation && "affiliation"].filter(Boolean).join(", ")}.`, "warning");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FlashError("That email address doesn't look right.", "warning");
      if (!(MEMBER_CATEGORIES as readonly string[]).includes(approvedAs)) throw new FlashError("Choose a valid member category.", "warning");
      const validUntil = readValidUntil(String(formData.get("validUntil") ?? ""), { mustBeFuture: true });

      const dup = await findDuplicateMember(name, email);
      if (dup) {
        throw new FlashError(
          dup.status === "pending" ? "This person already has a pending application - approve it from the Pending tab instead." : "This person is already a member.",
          "warning",
        );
      }

      const interests = String(formData.get("researchInterests") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);
      const member = new Member({
        name,
        email,
        phone: String(formData.get("phone") ?? "").trim() || undefined,
        affiliation,
        requestedAs: approvedAs,
        approvedAs,
        photo: String(formData.get("photo") ?? "") || undefined,
        studyLevel: String(formData.get("studyLevel") ?? "").trim() || undefined,
        faculty: String(formData.get("faculty") ?? "").trim() || undefined,
        referee: String(formData.get("referee") ?? "").trim().slice(0, 160) || undefined,
        researchInterests: interests,
        status: "approved",
        validUntil,
        // Added by an admin, so there is nothing left for them to verify.
        verification: { nameMatches: true, affiliationConfirmed: true, photoSuitable: true },
        reviewNote: "Added by admin",
        reviewedBy: session.sub,
        reviewedAt: new Date(),
      });
      const cardId = await saveWithCardId(member);
      createdId = String(member._id);

      if (formData.get("includeInTeamBoard") === "on") {
        const category = teamCategoryFor(approvedAs, member.studyLevel, await listTeamCategories());
        member.includeInTeamBoard = true;
        member.teamCategory = category;
        member.teamCategories = [category];
        await member.save();
        await syncMemberTeamBoard(member, { include: true, categories: [category] });
      }

      if (formData.get("sendEmail") === "on") {
        const cardUrl = `${await getBaseUrl()}/verify/${cardId}`;
        const mail = await sendMail({
          to: email,
          subject: "Your AILO Digital Member Card",
          text: cardEmailText(member, `Anda telah didaftarkan sebagai anggota AILO ("${approvedAs}") oleh admin kami.`, cardId, validUntil, cardUrl),
        });
        notes.push(
          mail.sent
            ? { type: "success", text: `Card emailed to ${email}.` }
            : { type: "error", text: "The member was added, but the card email could not be sent - check the mail settings, then use Resend email." },
        );
      }
      if (approvedAs === "Dosen") {
        const note = dosenNoteOf(await provisionDosenAccount(member));
        notes.push({ type: note.includes("could not") ? "error" : "success", text: note });
      }
    },
    { success: "Member added and card issued.", error: "Couldn't add the member. Please try again." },
  );
  for (const n of notes) await flash(n.type, n.text);
  revalidatePath("/admin/members");
  revalidatePath("/admin/team");
  revalidatePath("/team");
  if (ok) redirect(`/admin/members?status=approved&id=${createdId}`);
  redirect("/admin/members/new");
}

/** Permanently deletes a member record. Their Team Board profile is only hidden, and any lecturer login is left alone. */
export async function deleteMemberAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await withFlash(
    async () => {
      await connectToDatabase();
      const member = await Member.findById(id);
      if (!member) throw new FlashError("This member no longer exists.");
      await Team.updateMany({ member: member._id }, { isActive: false, $unset: { member: "" } });
      await Member.findByIdAndDelete(id);
    },
    { success: "Member deleted.", error: "Couldn't delete the member. Please try again." },
  );
  revalidatePath("/admin/members");
  revalidatePath("/admin/team");
  revalidatePath("/team");
}
