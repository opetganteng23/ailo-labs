import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

const deviceInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  specification: z.string().trim().optional(),
  photo: z.string().trim().optional(),
  status: z.enum(["available", "booked", "maintenance"]).default("available"),
});

export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    await connectToDatabase();
    const { slug } = await ctx.params;
    const lab = await Lab.findOne({ slug }).lean<{ _id: string }>();
    if (!lab) return NextResponse.json({ success: false, error: "Lab not found." }, { status: 404 });
    const devices = await Device.find({ lab: lab._id }).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: devices });
  } catch (error) {
    console.error("Failed to list devices", error);
    return NextResponse.json({ success: false, error: "Unable to load devices." }, { status: 503 });
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const parsed = deviceInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Some of the information isn't valid. Please check it and try again." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const { slug } = await ctx.params;
    const lab = await Lab.findOne({ slug });
    if (!lab) return NextResponse.json({ success: false, error: "Lab not found." }, { status: 404 });

    const device = await Device.create({ ...parsed.data, lab: lab._id });
    lab.devices.push(device._id);
    await lab.save();

    return NextResponse.json({ success: true, data: device }, { status: 201 });
  } catch (error) {
    console.error("Failed to create device", error);
    return NextResponse.json({ success: false, error: "Unable to create device." }, { status: 500 });
  }
}
