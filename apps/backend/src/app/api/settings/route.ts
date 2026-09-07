import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "global" })
      .select("-updatedBy")
      .lean();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to load site settings", error);

    return NextResponse.json(
      { success: false, error: "Unable to load site settings." },
      { status: 503 },
    );
  }
}
