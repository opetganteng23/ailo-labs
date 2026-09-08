import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), isActive: true }).select(
      "+passwordHash",
    );

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      data: { email: user.email, name: user.name, role: user.role },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Failed to log in", error);
    return NextResponse.json({ success: false, error: "Unable to log in." }, { status: 500 });
  }
}
