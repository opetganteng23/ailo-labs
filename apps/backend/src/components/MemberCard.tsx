import QRCode from "qrcode";

export type MemberCardData = {
  name: string;
  cardId: string;
  category: string;
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
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 1, width: 240, color: { dark: "#12181b", light: "#ffffff" } });

  return (
    <div className="member-card-pair">
      {/* Front */}
      <div className="member-card member-card-front">
        <div className="member-card-header">
          <div className="member-card-logo">LOGO</div>
          <div>
            <div className="member-card-org">CoE AILO</div>
            <div className="member-card-org-sub">Telkom University</div>
          </div>
        </div>
        <div className="member-card-body">
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
            <img src={data.photo} alt={data.name} className="member-card-photo" />
          ) : (
            <div className="member-card-photo member-card-photo-placeholder">Photo</div>
          )}
          <div className="member-card-info">
            <span className="member-card-tag">MEMBER</span>
            <span className="member-card-name">{data.name}</span>
            <span className="member-card-category">{data.category}</span>
          </div>
        </div>
        <div className="member-card-footer">
          <div>
            <span className="member-card-label">MEMBER ID</span>
            <span className="member-card-value">{data.cardId}</span>
          </div>
          <div>
            <span className="member-card-label">VALID UNTIL</span>
            <span className="member-card-value">{formatValidUntil(data.validUntil)}</span>
          </div>
        </div>
      </div>

      {/* Back */}
      <div className="member-card member-card-back">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI, not a static asset */}
        <img src={qrDataUrl} alt="Verification QR code" className="member-card-qr" />
        <span className="member-card-scan">Scan to verify</span>
        <a href={data.verifyUrl} className="member-card-verify-link">
          VERIFY ONLINE
        </a>
        <span className="member-card-signature">Head of CoE AILO</span>
      </div>
    </div>
  );
}
