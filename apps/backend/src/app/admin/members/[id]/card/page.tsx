import Link from "next/link";
import { notFound } from "next/navigation";

import { getBaseUrl } from "@/lib/baseUrl";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { MemberCard } from "@/components/MemberCard";

import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function AdminMemberCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const member = await Member.findById(id).lean<{
    name: string;
    approvedAs?: string;
    requestedAs: string;
    photo?: string;
    cardId?: string;
    validUntil?: Date;
    status: string;
  }>();

  if (!member || !member.cardId) notFound();

  const baseUrl = await getBaseUrl();
  const verifyUrl = `${baseUrl}/verify/${member.cardId}`;

  return (
    <div>
      <p>
        <Link href="/admin/members?status=approved">Members</Link> / {member.name}
      </p>
      <h1>Digital member card</h1>
      <div style={{ marginTop: 24 }}>
        <MemberCard
          data={{
            name: member.name,
            cardId: member.cardId,
            category: member.approvedAs ?? member.requestedAs,
            photo: member.photo,
            validUntil: member.validUntil,
            verifyUrl,
          }}
        />
      </div>
      <div style={{ marginTop: 20 }}>
        <PrintButton />
      </div>
    </div>
  );
}
