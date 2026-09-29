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

      {/* Back */}
      <div className="member-card member-card-back">
        <div className="member-card-back-bar" />
        <div className="member-card-back-qr-col">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI, not a static asset */}
          <img src={qrDataUrl} alt="Verification QR code" className="member-card-qr" />
          <span className="member-card-scan">Scan to verify</span>
        </div>
        <div className="member-card-back-text">
          <span className="member-card-statement">This card identifies a member of CoE AILO, Telkom University.</span>
          <span className="member-card-disclaimer">
            Valid only with a current status on the verification page. Non-transferable. If found, please return to the CoE AILO office.
          </span>
          <div className="member-card-verify">
            <span className="member-card-verify-label">VERIFY ONLINE</span>
            <span className="member-card-verify-url">{data.verifyUrl.replace(/^https?:\/\//, "")}</span>
          </div>
          <div className="member-card-signature">
            <span className="member-card-signature-line" />
            <span className="member-card-signature-name">Head of CoE AILO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
