import { NextResponse } from "next/server";

/**
 * Public self-registration is closed: only lecturers (dosen) and admins have
 * accounts. Visitors join as members at /join and book labs with their card.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Public accounts are no longer available. Join AILO as a member at /join instead." },
    { status: 410 },
  );
}
