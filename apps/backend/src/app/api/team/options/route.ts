import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

/** Active team profiles (name + id) for the "who worked on this" pickers. The names are already public on /team. */
export async function GET() {
  try {
    await connectToDatabase();
    const rows = await Team.find({ isActive: true }).sort({ name: 1 }).select("name").lean<{ _id: unknown; name: string }[]>();
    return NextResponse.json({ success: true, data: rows.map((r) => ({ id: String(r._id), name: r.name })) });
  } catch (error) {
    console.error("Failed to list team options", error);
    return NextResponse.json({ success: false, error: "Unable to load team members." }, { status: 500 });
  }
}
