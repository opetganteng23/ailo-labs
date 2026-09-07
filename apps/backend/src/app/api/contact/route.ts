import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  const parsed = contactSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid contact payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const contactMessage = await ContactMessage.create(parsed.data);

    return NextResponse.json(
      { success: true, data: { id: contactMessage.id } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create contact message", error);

    return NextResponse.json(
      { success: false, error: "Unable to send contact message." },
      { status: 503 },
    );
  }
}
