import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendBookingDecision } from "@/lib/bookingDecision";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["approved", "rejected", "completed", "cancelled"]),
  reviewNote: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request, ["super_admin", "admin", "staff_lab"]);
  if (!auth.ok) return auth.response;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const { id } = await ctx.params;

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote,
        reviewedBy: auth.session.sub,
      },
      { new: true },
    )
      .populate("lab", "name")
      .populate("device", "name");

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }

    if (parsed.data.status === "approved" && booking.device) {
      await Device.findByIdAndUpdate(booking.device, { status: "booked" });
    }

    await sendBookingDecision(booking, parsed.data.status, parsed.data.reviewNote);

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Failed to update booking", error);
    return NextResponse.json({ success: false, error: "Unable to update booking." }, { status: 500 });
  }
}
