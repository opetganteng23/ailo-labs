import QRCode from "qrcode";

import { MemberCardFront } from "./MemberCardFront";

export type MemberCardData = {
  name: string;
  cardId: string;
  category: string;
  affiliation?: string;
  photo?: string;
  validUntil?: Date | string | null;
  verifyUrl: string;
};

function formatValidUntil(validUntil?: Date | string | null): string {
  if (!validUntil) return "No expiry";
  const date = new Date(validUntil);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function MemberCard({ data }: { data: MemberCardData }) {
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 160, color: { dark: "#0b1e20", light: "#ffffff" } });

  return (
    <div className="member-card-pair">
      <MemberCardFront
        name={data.name}
        category={data.category}
        affiliation={data.affiliation}
        photo={data.photo}
        cardId={data.cardId}
        validUntil={formatValidUntil(data.validUntil)}
        qrSrc={qrDataUrl}
      />
    </div>
  );
}
