import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

const settingsInputSchema = z.object({
  branding: z
    .object({ logo: z.string().optional(), favicon: z.string().optional(), siteName: z.string().optional(), tagline: z.string().optional() })
    .optional(),
  contact: z
    .object({ email: z.string().optional(), phone: z.string().optional(), address: z.string().optional(), officeHours: z.string().optional() })
    .optional(),
  socialMedia: z
    .object({ instagram: z.string().optional(), linkedin: z.string().optional(), youtube: z.string().optional(), twitter: z.string().optional() })
    .optional(),
  featureToggles: z
    .object({ booking: z.boolean().optional(), newsAI: z.boolean().optional(), tts: z.boolean().optional() })
    .optional(),
  chatbot: z
    .object({ isEnabled: z.boolean().optional(), welcomeMessage: z.string().optional(), widgetColor: z.string().optional() })
    .optional(),
});

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

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const parsed = settingsInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { ...parsed.data, updatedBy: auth.session.sub } },
      { new: true, upsert: true },
    );
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to update site settings", error);
    return NextResponse.json({ success: false, error: "Unable to update site settings." }, { status: 500 });
  }
}
