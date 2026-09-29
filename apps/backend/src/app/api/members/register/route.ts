import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendMail } from "@/lib/mailer";
import { connectToDatabase } from "@/lib/mongodb";
import { MEMBER_CATEGORIES, Member } from "@/models/Member";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(40).optional(),
  password: z.string().min(8).max(200),
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
      { success: false, error: "Please fill in every field, including photo and proof document.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();

    // The registration also creates the applicant's sign-in account. An existing
    // account is reused only when the password matches, so nobody can attach a
    // membership to someone else's email.
    const { password, ...memberData } = parsed.data;
    const email = memberData.email.toLowerCase();
    const existingUser = await User.findOne({ email }).select("+passwordHash");
    if (existingUser) {
      const matches = await bcrypt.compare(password, existingUser.passwordHash);
      if (!matches) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists. Use its password, or sign in first." },
          { status: 409 },
        );
      }
    }

    const member = await Member.create({ ...memberData, status: "pending" });

    if (existingUser) {
      existingUser.member = member._id;
      existingUser.photo = existingUser.photo || memberData.photo;
      await existingUser.save();
    } else {
      await User.create({
        name: memberData.name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        phone: memberData.phone,
        photo: memberData.photo,
        member: member._id,
        role: "borrower",
      });
    }

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
