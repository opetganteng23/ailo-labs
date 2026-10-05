import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendMail } from "@/lib/mailer";
import { duplicateMessage, findDuplicateMember } from "@/lib/memberDuplicate";
import { connectToDatabase } from "@/lib/mongodb";
import { MEMBER_CATEGORIES, Member } from "@/models/Member";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(40).optional(),
  affiliation: z.string().trim().min(1).max(200),
  requestedAs: z.enum(MEMBER_CATEGORIES),
  photo: z.string().trim().min(1),
  proofDocument: z.string().trim().min(1),
  studyLevel: z.string().trim().max(10).optional(),
  researchInterests: z.array(z.string().trim().max(60)).max(10).optional(),
  motivation: z.string().trim().max(1000).optional(),
  showProfilePublicly: z.boolean().optional(),
  profiles: z
    .object({
      linkedin: z.string().trim().max(300).optional(),
      orcid: z.string().trim().max(300).optional(),
      googleScholar: z.string().trim().max(300).optional(),
      sinta: z.string().trim().max(300).optional(),
      scopus: z.string().trim().max(300).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Please fill in every field, including photo and proof document." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();

    // Never create a second record for someone who is already a member (§3).
    const dup = await findDuplicateMember(parsed.data.name, parsed.data.email);
    if (dup) {
      return NextResponse.json({ success: false, duplicate: true, error: duplicateMessage(dup) }, { status: 409 });
    }

    // Members don't get a login; their card and status arrive by email. A lecturer
    // (Dosen) gets a dosen account when an admin approves the application.
    const member = await Member.create({ ...parsed.data, status: "pending" });

    await sendMail({
      to: parsed.data.email,
      subject: "AILO Membership Application Received",
      text: `Halo ${parsed.data.name},\n\nPermintaan keanggotaan AILO Anda sebagai "${parsed.data.requestedAs}" telah kami terima dan sedang ditinjau admin.\n\nAnda akan menerima email begitu status pengajuan berubah.\n\nTerima kasih,\nTim AILO`,
    });

    const adminEmail = process.env.APP_EMAIL;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `New Member Application - ${parsed.data.name}`,
        text: `Pengajuan keanggotaan baru dari ${parsed.data.name} (${parsed.data.email}), sebagai "${parsed.data.requestedAs}".\nAfiliasi: ${parsed.data.affiliation}\n\nSilakan tinjau di /admin/members.`,
      });
    }

    return NextResponse.json({ success: true, data: { id: member._id } }, { status: 201 });
  } catch (error) {
    console.error("Failed to create member application", error);
    return NextResponse.json({ success: false, error: "Unable to submit application." }, { status: 500 });
  }
}
