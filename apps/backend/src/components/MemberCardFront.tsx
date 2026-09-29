/**
 * Presentational front face of the AILO member card. No data fetching or hooks,
 * so the server card (admin/verify) and the client-side registration preview
 * render exactly the same face.
 */
export function MemberCardFront({
  name,
  category,
  affiliation,
  photo,
  cardId,
  validUntil,
  qrSrc,
}: {
  name: string;
  category: string;
  affiliation?: string;
  photo?: string;
  cardId: string;
  validUntil: string;
  qrSrc: string;
}) {
  return (
    <div className="member-card member-card-front">
      <div className="member-card-ring" />
      <div className="member-card-stripe" />
      <div className="member-card-inner">
      <div className="member-card-header">
        <div className="member-card-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo mark */}
          <img src="/logo-square.png" alt="AILO" />
        </div>
        <div>
          <div className="member-card-org">CoE AILO</div>
          <div className="member-card-org-sub">Telkom University</div>
        </div>
        <span className="member-card-badge">MEMBER</span>
      </div>
      <div className="member-card-body">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
          <img src={photo} alt={name} className="member-card-photo" />
        ) : (
          <div className="member-card-photo member-card-photo-placeholder">Photo</div>
        )}
        <div className="member-card-info">
          <span className="member-card-name">{name}</span>
          <span className="member-card-category">{category}</span>
          {affiliation && <span className="member-card-affiliation">{affiliation}</span>}
        </div>
      </div>
      <div className="member-card-footer">
        <div>
          <span className="member-card-label">MEMBER ID</span>
          <span className="member-card-value">{cardId}</span>
        </div>
        <div>
          <span className="member-card-label">VALID UNTIL</span>
          <span className="member-card-value member-card-value-sans">{validUntil}</span>
        </div>
        <span className="member-card-front-qr">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI or static sample, not optimizable */}
          <img src={qrSrc} alt="Verification QR code" />
        </span>
      </div>
      </div>
    </div>
  );
}
