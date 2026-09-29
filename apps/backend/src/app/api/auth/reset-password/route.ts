import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { PasswordReset } from "@/models/PasswordReset";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, "The password must be at least 8 characters.").max(200),
});

export async function POST(request: NextRequest) {
  if (rateLimited(`reset:ip:${clientIp(request.headers)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const message = parsed.error.issues.find((i) => i.path[0] === "password")?.message ?? "This reset link is invalid.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
    // Atomically claim the link so it can only be used once.
    const reset = await PasswordReset.findOneAndUpdate(
      { tokenHash, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { usedAt: new Date() },
    ).lean<{ user: unknown }>();
    if (!reset) {
      return NextResponse.json(
        { success: false, error: "This reset link has expired or was already used. Request a new one." },
        { status: 410 },
      );
    }

    await User.findByIdAndUpdate(reset.user, { passwordHash: await bcrypt.hash(parsed.data.password, 12) });
    await PasswordReset.deleteMany({ user: reset.user, usedAt: { $exists: false } });

    return NextResponse.json({ success: true, data: { message: "Your password has been changed. You can sign in now." } });
  } catch (error) {
    console.error("Failed to reset password", error);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
