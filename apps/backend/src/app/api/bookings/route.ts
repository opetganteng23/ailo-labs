import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

const bookingInputSchema = z
  .object({
    borrowerName: z.string().trim().min(1).max(160),
    borrowerEmail: z.string().trim().email(),
    borrowerPhone: z.string().trim().min(5).max(40),
    institution: z.string().trim().min(1).max(200),
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

export async function POST(request: NextRequest) {
  const parsed = bookingInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid booking payload.", details: parsed.error.flatten() },
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

    const booking = await Booking.create({ ...data, status: "pending" });

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
