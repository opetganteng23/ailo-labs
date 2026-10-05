import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { Booking } from "@/models/Booking";
import { Lab } from "@/models/Lab";
import { Member } from "@/models/Member";

export const dynamic = "force-dynamic";

const bookingInputSchema = z
  .object({
    borrowerName: z.string().trim().min(1).max(160),
    borrowerEmail: z.string().trim().email(),
    borrowerPhone: z.string().trim().min(8, "Enter a valid WhatsApp number.").max(40),
    memberCardId: z.string().trim().min(4, "Enter your AILO member card number.").max(40),
    lab: z.string().trim().min(1),
    device: z.string().trim().optional(),
    purpose: z.string().trim().min(5).max(2000),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
  })
  .refine((data) => data.endDateTime > data.startDateTime, {
    message: "endDateTime must be after startDateTime.",
    path: ["endDateTime"],
  });

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const status = request.nextUrl.searchParams.get("status");
    const filter = status && status !== "all" ? { status } : {};
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate("lab", "name slug")
      .populate("device", "name")
      .lean();
    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Failed to list bookings", error);
    return NextResponse.json({ success: false, error: "Unable to load bookings." }, { status: 503 });
  }
}

/**
 * Public booking request. No account: the borrower proves membership with an
 * approved, unexpired AILO member card whose registered email matches.
 */
export async function POST(request: NextRequest) {
  if (rateLimited(`booking:ip:${clientIp(request.headers)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const parsed = bookingInputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { success: false, error: first?.message && !first.message.startsWith("Invalid") ? first.message : "Please fill in every required field." },
      { status: 400 },
    );
  }

  const { data } = parsed;

  try {
    await connectToDatabase();

    const lab = await Lab.findById(data.lab).lean<{ _id: string; name: string }>();
    if (!lab) {
      return NextResponse.json({ success: false, error: "Lab not found." }, { status: 404 });
    }
    if (data.startDateTime < new Date()) {
      return NextResponse.json({ success: false, error: "Pick a time in the future." }, { status: 400 });
    }

    const cardId = data.memberCardId.toUpperCase().replace(/\s+/g, "");
    const member = await Member.findOne({ cardId }).lean<{ _id: unknown; email: string; status: string; validUntil?: Date; affiliation?: string }>();
    if (!member || member.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "This member card number isn't active. Check the number on your AILO member card, or join AILO first." },
        { status: 403 },
      );
    }
    if (member.email.toLowerCase() !== data.borrowerEmail.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Use the email address registered with this member card." }, { status: 403 });
    }
    if (member.validUntil && new Date(member.validUntil) < data.endDateTime) {
      return NextResponse.json({ success: false, error: "Your member card expires before this booking ends." }, { status: 403 });
    }

    const conflictFilter: Record<string, unknown> = {
      lab: data.lab,
      status: "approved",
      startDateTime: { $lt: data.endDateTime },
      endDateTime: { $gt: data.startDateTime },
    };
    if (data.device) {
      conflictFilter.device = data.device;
    }

    const conflict = await Booking.findOne(conflictFilter).lean();
    if (conflict) {
      return NextResponse.json(
        { success: false, error: "This lab/device is already booked for the requested time window." },
        { status: 409 },
      );
    }

    const booking = await Booking.create({
      ...data,
      memberCardId: cardId,
      member: member._id,
      institution: member.affiliation,
      status: "pending",
    });

    await sendMail({
      to: data.borrowerEmail,
      subject: "AILO Lab Booking Request Received",
      text: `Halo ${data.borrowerName},\n\nPermintaan peminjaman lab "${lab.name}" Anda telah kami terima dan sedang menunggu persetujuan admin.\n\nJadwal: ${data.startDateTime.toLocaleString()} - ${data.endDateTime.toLocaleString()}\nTujuan: ${data.purpose}\n\nTerima kasih,\nTim AILO`,
    });

    const adminEmail = process.env.APP_EMAIL;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `New Booking Request - ${lab.name}`,
        text: `Booking baru dari ${data.borrowerName} (${data.borrowerEmail}) untuk lab "${lab.name}".\nJadwal: ${data.startDateTime.toLocaleString()} - ${data.endDateTime.toLocaleString()}\nTujuan: ${data.purpose}\n\nSilakan tinjau di /admin/bookings.`,
      });
    }

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking", error);
    return NextResponse.json({ success: false, error: "Unable to create booking." }, { status: 500 });
  }
}
