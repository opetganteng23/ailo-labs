import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";

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
    const members = await Member.find(filter)
      .sort({ createdAt: -1 })
      .lean<
        {
          _id: string;
          name: string;
          email: string;
          phone: string;
          affiliation: string;
          requestedAs: string;
          approvedAs?: string;
          status: string;
          cardId?: string;
          validUntil?: Date;
          createdAt: Date;
        }[]
      >();

    const header = ["Name", "Email", "Phone", "Affiliation", "Requested As", "Approved As", "Status", "Card ID", "Valid Until", "Submitted At"];

    const rows = members.map((m) =>
      [
        m.name,
        m.email,
        m.phone,
        m.affiliation,
        m.requestedAs,
        m.approvedAs ?? "",
        m.status,
        m.cardId ?? "",
        m.validUntil ? new Date(m.validUntil).toISOString() : "",
        new Date(m.createdAt).toISOString(),
      ]
        .map(csvEscape)
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    const filename = `ailo-members-${status ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export members", error);
    return NextResponse.json({ success: false, error: "Unable to export members." }, { status: 503 });
  }
}
