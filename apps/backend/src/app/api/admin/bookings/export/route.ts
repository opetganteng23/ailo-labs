import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const status = request.nextUrl.searchParams.get("status");
  const filter = status && status !== "all" ? { status } : {};

  try {
    await connectToDatabase();
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate("lab", "name")
      .populate("device", "name")
      .lean<
        {
          _id: string;
          borrowerName: string;
          borrowerEmail: string;
          borrowerPhone: string;
          institution: string;
          purpose: string;
          status: string;
          startDateTime: Date;
          endDateTime: Date;
          createdAt: Date;
          lab?: { name?: string };
          device?: { name?: string };
        }[]
      >();

    const header = [
      "Borrower Name",
      "Email",
      "Phone",
      "Institution",
      "Lab",
      "Device",
      "Purpose",
      "Start",
      "End",
      "Status",
      "Requested At",
    ];

    const rows = bookings.map((b) =>
      [
        b.borrowerName,
        b.borrowerEmail,
        b.borrowerPhone,
        b.institution,
        b.lab?.name ?? "",
        b.device?.name ?? "",
        b.purpose,
        new Date(b.startDateTime).toISOString(),
        new Date(b.endDateTime).toISOString(),
        b.status,
        new Date(b.createdAt).toISOString(),
      ]
        .map(csvEscape)
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    const filename = `ailo-bookings-${status ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export bookings", error);
    return NextResponse.json({ success: false, error: "Unable to export bookings." }, { status: 503 });
  }
}
