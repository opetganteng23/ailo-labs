import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBaseUrl } from "@/lib/baseUrl";
import { connectToDatabase } from "@/lib/mongodb";
import { Member } from "@/models/Member";
import { MemberCard } from "@/components/MemberCard";

export const dynamic = "force-dynamic";

export default async function VerifyMemberPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  await connectToDatabase();
  const member = await Member.findOne({ cardId }).lean<{
    name: string;
    approvedAs?: string;
    requestedAs: string;
    photo?: string;
    cardId?: string;
    validUntil?: Date;
    status: string;
  }>();

  const isValid =
    !!member &&
    member.status === "approved" &&
    (!member.validUntil || new Date(member.validUntil).getTime() >= new Date().getTime());

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <h1>Member verification</h1>
        {!member && <p className="notice">No member found with card ID &quot;{cardId}&quot;.</p>}
        {member && !isValid && (
          <p className="notice" style={{ background: "#fbdada", borderColor: "#f5a3a3" }}>
            This card ({cardId}) is not currently valid ({member.status === "approved" ? "expired" : member.status}).
          </p>
        )}
        {member && isValid && (
          <>
            <p style={{ color: "#146c43", fontWeight: 600, marginBottom: 16 }}>Valid AILO member card</p>
            <MemberCard
              data={{
                name: member.name,
                cardId: member.cardId!,
                category: member.approvedAs ?? member.requestedAs,
                photo: member.photo,
                validUntil: member.validUntil,
                verifyUrl: `${await getBaseUrl()}/verify/${member.cardId}`,
              }}
            />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
