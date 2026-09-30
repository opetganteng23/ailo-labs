import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { getBaseUrl } from "@/lib/baseUrl";
import { sendMail } from "@/lib/mailer";
import { PasswordReset } from "@/models/PasswordReset";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

const SETUP_HOURS = 72;

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type MemberLike = { _id: unknown; name: string; email: string; photo?: string };

/** Finds the lecturer's team profile by email, or creates a hidden one to fill in. */
export async function ensureTeamProfile(person: { name: string; email: string; photo?: string }) {
  const email = person.email.toLowerCase();
  const existing = await Team.findOne({ email });
  if (existing) return existing;
  let slug = slugify(person.name) || "dosen";
  if (await Team.exists({ slug })) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
  return Team.create({ name: person.name, slug, position: "Dosen", category: "Dosen", email, photo: person.photo, isActive: false });
}

/**
 * Called when an admin approves a member as "Dosen": makes sure the lecturer has
 * a dosen account linked to a team profile, and emails a link to set their
 * password. Admin/staff accounts are left as they are.
 */
export async function provisionDosenAccount(member: MemberLike): Promise<{ created: boolean; mailSent: boolean; skipped?: string }> {
  const email = member.email.toLowerCase();
  let user = await User.findOne({ email });
  if (user && ["super_admin", "admin", "staff_lab"].includes(user.role)) {
    return { created: false, mailSent: true, skipped: "already an admin/staff account" };
  }

  // Team profile the lecturer will manage (hidden until an admin publishes it).
  const team = await ensureTeamProfile(member);

  const created = !user;
  if (!user) {
    user = await User.create({
      name: member.name,
      email,
      role: "dosen",
      photo: member.photo,
      member: member._id,
      team: team._id,
      // Unusable until they set their own password from the email link.
      passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
    });
  } else {
    user.role = "dosen";
    user.member = member._id;
    user.team = team._id;
    user.photo = user.photo || member.photo;
    user.isActive = true;
    await user.save();
  }

  const token = crypto.randomBytes(32).toString("base64url");
  await PasswordReset.deleteMany({ user: user._id, usedAt: { $exists: false } });
  await PasswordReset.create({
    user: user._id,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + SETUP_HOURS * 60 * 60 * 1000),
  });
  const base = await getBaseUrl();
  const mail = await sendMail({
    to: email,
    subject: "Your AILO lecturer dashboard account",
    text: `Halo ${member.name},\n\nAnda terdaftar sebagai Dosen di AILO. Kini Anda punya akses ke dashboard dosen untuk mengelola riset, proyek, profil tim, dan mengirim draft berita (semua ditinjau admin sebelum tayang).\n\nBuat password Anda di sini (berlaku ${SETUP_HOURS} jam, sekali pakai):\n${base}/reset-password?token=${token}\n\nSetelah itu masuk di ${base}/login dengan email ${email}.\n\nTim AILO`,
  });
  return { created, mailSent: mail.sent };
}
