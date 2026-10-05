import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const userInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["super_admin", "admin", "staff_lab"]),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["super_admin"]);
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Failed to list users", error);
    return NextResponse.json({ success: false, error: "Unable to load users." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, ["super_admin"]);
  if (!auth.ok) return auth.response;

  const parsed = userInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Some of the information isn't valid. Please check it and try again." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      passwordHash,
    });
    return NextResponse.json({ success: true, data: { id: user._id, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user", error);
    const status = (error as { code?: number })?.code === 11000 ? 409 : 500;
    return NextResponse.json(
      { success: false, error: status === 409 ? "Email already registered." : "Unable to create user." },
      { status },
    );
  }
}
