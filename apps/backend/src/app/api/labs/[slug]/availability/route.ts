import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

/**
 * Returns booking date ranges + status for a lab within a month, so the
 * booking page and lab detail page can render a calendar of
 * full/pending/available days. Public: only exposes schedule info (no
 * borrower name/email/phone/purpose), so no login is required to view it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const monthParam = request.nextUrl.searchParams.get("month");
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : new Date().toISOString().slice(0, 7);
  const [year, monthIndex] = month.split("-").map(Number);

  const rangeStart = new Date(Date.UTC(year, monthIndex - 1, 1));
  const rangeEnd = new Date(Date.UTC(year, monthIndex, 1));

  try {
    await connectToDatabase();
    const lab = await Lab.findOne({ slug }).select("_id").lean<{ _id: string }>();
    if (!lab) {
      return NextResponse.json({ success: false, error: "Lab not found." }, { status: 404 });
    }

    const bookings = await Booking.find({
      lab: lab._id,
      status: { $in: ["pending", "approved"] },
      startDateTime: { $lt: rangeEnd },
      endDateTime: { $gt: rangeStart },
    })
      .select("startDateTime endDateTime status device")
      .lean();

    return NextResponse.json({
      success: true,
      data: bookings.map((b) => ({
        startDateTime: b.startDateTime,
        endDateTime: b.endDateTime,
        status: b.status,
        device: b.device ? String(b.device) : null,
      })),
    });
  } catch (error) {
    console.error("Failed to load lab availability", error);
    return NextResponse.json({ success: false, error: "Unable to load availability." }, { status: 503 });
  }
}
