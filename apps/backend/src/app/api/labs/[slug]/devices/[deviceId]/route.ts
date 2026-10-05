import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

const deviceUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  specification: z.string().trim().optional(),
  photo: z.string().trim().optional(),
  status: z.enum(["available", "booked", "maintenance"]).optional(),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ slug: string; deviceId: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const parsed = deviceUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Some of the information isn't valid. Please check it and try again." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const { slug, deviceId } = await ctx.params;
    const lab = await Lab.findOne({ slug }).lean<{ _id: string }>();
    if (!lab) return NextResponse.json({ success: false, error: "Lab not found." }, { status: 404 });

    const device = await Device.findOneAndUpdate({ _id: deviceId, lab: lab._id }, parsed.data, { new: true });
    if (!device) return NextResponse.json({ success: false, error: "Device not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: device });
  } catch (error) {
    console.error("Failed to update device", error);
    return NextResponse.json({ success: false, error: "Unable to update device." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ slug: string; deviceId: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const { slug, deviceId } = await ctx.params;
    const lab = await Lab.findOne({ slug });
    if (!lab) return NextResponse.json({ success: false, error: "Lab not found." }, { status: 404 });

    const device = await Device.findOneAndDelete({ _id: deviceId, lab: lab._id });
    if (!device) return NextResponse.json({ success: false, error: "Device not found." }, { status: 404 });

    lab.devices = lab.devices.filter((d: unknown) => String(d) !== deviceId);
    await lab.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete device", error);
    return NextResponse.json({ success: false, error: "Unable to delete device." }, { status: 500 });
  }
}
