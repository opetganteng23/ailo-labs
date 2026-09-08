import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createUserSessionToken, USER_SESSION_COOKIE } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  phone: z.string().trim().min(5).max(40),
});

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid registration data." }, { status: 400 });
  }

  const { name, email, password, phone } = parsed.data;

  try {
    await connectToDatabase();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role: "borrower",
    });

    const token = await createUserSessionToken({
      sub: user._id.toString(),
      email: user.email,
      role: "borrower",
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      data: { email: user.email, name: user.name, role: user.role },
    });
    response.cookies.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Failed to register user", error);
    return NextResponse.json({ success: false, error: "Unable to register." }, { status: 500 });
  }
}
