import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getBaseUrl } from "@/lib/baseUrl";
import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { PasswordReset } from "@/models/PasswordReset";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const RESET_MINUTES = 60;
const schema = z.object({ email: z.string().trim().email() });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  // Limits guessing which emails have accounts, and mail flooding.
  if (rateLimited(`forgot:ip:${clientIp(request.headers)}`, 8, 15 * 60 * 1000) || rateLimited(`forgot:email:${email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email, isActive: true }).lean<{ _id: unknown; name: string; email: string }>();
    if (!user) {
      return NextResponse.json({ success: false, error: "No account uses this email address." }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    // Only the newest link works.
    await PasswordReset.deleteMany({ user: user._id, usedAt: { $exists: false } });
    await PasswordReset.create({ user: user._id, tokenHash, expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000) });

    const link = `${await getBaseUrl()}/reset-password?token=${token}`;
    const mail = await sendMail({
      to: user.email,
      subject: "Reset your AILO password",
      text: `Halo ${user.name},\n\nKami menerima permintaan untuk mengatur ulang password akun AILO Anda.\n\nBuka tautan ini untuk membuat password baru (berlaku ${RESET_MINUTES} menit dan hanya bisa dipakai sekali):\n${link}\n\nJika Anda tidak meminta ini, abaikan email ini. Password Anda tidak berubah.\n\nTim AILO`,
    });
    if (!mail.sent) {
      await PasswordReset.deleteOne({ tokenHash });
      return NextResponse.json(
        { success: false, error: "We couldn't send the email right now. Please try again later or contact the AILO team." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, data: { message: `We've sent a reset link to ${user.email}. It expires in ${RESET_MINUTES} minutes.` } });
  } catch (error) {
    console.error("Failed to start password reset", error);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
