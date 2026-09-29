import QRCode from "qrcode";

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
      {/* Front */}
      <div className="member-card member-card-front">
        <div className="member-card-ring" />
        <div className="member-card-stripe" />
        <div className="member-card-header">
          <div className="member-card-logo">LOGO</div>
          <div>
            <div className="member-card-org">CoE AILO</div>
            <div className="member-card-org-sub">Telkom University</div>
          </div>
          <span className="member-card-badge">MEMBER</span>
        </div>
        <div className="member-card-body">
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
            <img src={data.photo} alt={data.name} className="member-card-photo" />
          ) : (
            <div className="member-card-photo member-card-photo-placeholder">Photo</div>
          )}
          <div className="member-card-info">
            <span className="member-card-name">{data.name}</span>
            <span className="member-card-category">{data.category}</span>
            {data.affiliation && <span className="member-card-affiliation">{data.affiliation}</span>}
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
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI, not a static asset */}
          <img src={qrDataUrl} alt="Verification QR code" className="member-card-front-qr" />
        </div>
      </div>

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
