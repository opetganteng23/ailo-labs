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
    affiliation?: string;
    photo?: string;
    cardId?: string;
    validUntil?: Date;
    reviewedAt?: Date;
    createdAt?: Date;
    status: string;
  }>();

  if (!member || !member.cardId) notFound();

  const baseUrl = await getBaseUrl();
  const verifyUrl = `${baseUrl}/verify/${member.cardId}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/members?status=approved" style={{ color: "#5b6664", fontWeight: 500 }}>
          Members
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{member.name}</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Digital member card</h1>
      <div>
        <MemberCard
          data={{
            name: member.name,
            cardId: member.cardId,
            category: member.approvedAs ?? member.requestedAs,
            affiliation: member.affiliation,
            photo: member.photo,
            validUntil: member.validUntil,
            issuedAt: member.reviewedAt ?? member.createdAt,
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
