import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional(),
});

// Light per-IP throttle so the public form can't be used to flood the inbox.
const recent = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

export async function POST(request: NextRequest) {
  const parsed = contactSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Please fill in every field (message at least 10 characters)." },
      { status: 400 },
    );
  }

  const { website, ...data } = parsed.data;
  // Honeypot filled: pretend success, store nothing.
  if (website) return NextResponse.json({ success: true, data: { id: null } }, { status: 201 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(ip)) {
    return NextResponse.json({ success: false, error: "Too many messages. Please try again in a few minutes." }, { status: 429 });
  }

  try {
    await connectToDatabase();
    const contactMessage = await ContactMessage.create(data);

    // Receipt for the sender and a heads-up for the team; failures don't block the message.
    await sendMail({
      to: data.email,
      subject: "Pesan Anda sudah kami terima - AILO",
      text: `Halo ${data.name},

Terima kasih sudah menghubungi AILO. Pesan Anda dengan subjek "${data.subject}" sudah kami terima. Tim kami akan membalas ke email ini.

Salam,
Tim AILO`,
    });
    if (process.env.APP_EMAIL) {
      await sendMail({
        to: process.env.APP_EMAIL,
        subject: `Pesan baru dari ${data.name}: ${data.subject}`,
        text: `${data.name} <${data.email}> mengirim pesan lewat form kontak:

${data.message}

Balas di /admin/messages.`,
      });
    }

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
