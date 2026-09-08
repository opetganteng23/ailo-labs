import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  role: z.enum(["super_admin", "admin", "staff_lab"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request, ["super_admin"]);
  if (!auth.ok) return auth.response;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const { id } = await ctx.params;
    const update: Record<string, unknown> = { ...parsed.data };
    delete update.password;
    if (parsed.data.password) {
      update.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Failed to update user", error);
    return NextResponse.json({ success: false, error: "Unable to update user." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request, ["super_admin"]);
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const { id } = await ctx.params;
    if (auth.session.sub === id) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account." }, { status: 400 });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user", error);
    return NextResponse.json({ success: false, error: "Unable to delete user." }, { status: 500 });
  }
}
