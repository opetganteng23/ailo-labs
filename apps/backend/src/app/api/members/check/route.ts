import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { duplicateMessage, findDuplicateMember } from "@/lib/memberDuplicate";
import { connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimited } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({ name: z.string().trim().min(1).max(160), email: z.string().trim().email() });

/** Early check used by step 1 of the Join form; the register endpoint checks again. */
export async function POST(request: NextRequest) {
  if (rateLimited(`member-check:${clientIp(request.headers)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Enter your full name and a valid email." }, { status: 400 });

  try {
    await connectToDatabase();
    const dup = await findDuplicateMember(parsed.data.name, parsed.data.email);
    if (dup) return NextResponse.json({ success: false, duplicate: true, error: duplicateMessage(dup) }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member duplicate check failed", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan. Silakan coba kembali." }, { status: 500 });
  }
}
