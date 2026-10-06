import QRCode from "qrcode";

import { ScaledSheet } from "./ScaledSheet";

export type MemberCardData = {
  name: string;
  cardId: string;
  category: string;
  affiliation?: string;
  photo?: string;
  validUntil?: Date | string | null;
  /** When the card was issued; its year is printed on the card. */
  issuedAt?: Date | string | null;
  verifyUrl: string;
};

// Static text of the membership sheet.
const VISION =
  "To become a center of excellence in science and technology in Artificial Intelligence, based on the SAFE AI framework, that accelerates digital transformation and delivers both strategic and sustainable impact for science, industry, and society at national and global levels.";
const MISSION = [
  ["To advance", "state-of-the-art concepts, methodologies, and techniques in Artificial Intelligence, grounded in the principles of SAFE AI."],
  ["To develop", "secure, accountable, fair, and ethical AI-driven products, solutions, and innovations that contribute to sustainable societal progress and enhanced well-being."],
  [
    "To foster",
    "strategic collaborations in research, consultancy, implementation, policy development, and AI risk mitigation, based on SAFE AI principles, in partnership with industry, government, and research institutions at national and international levels.",
  ],
];
const BENEFITS = [
  ["Research Collaboration", "Join research projects in AI for learning and optimization."],
  ["Workshops & Training", "Build AI skills through workshops and talent development."],
  ["Industry & Partners", "Connect with industry, government, and research partners."],
  ["Meaningful Impact", "Contribute to SAFE AI solutions that benefit society."],
];

function formatValidUntil(validUntil?: Date | string | null): string {
  if (!validUntil) return "No expiry";
  return new Date(validUntil).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** The affiliation is stored as one string ("Institution · Program · NIM/NIP 123 · Angkatan 2025"); split it back into its lines. */
function splitAffiliation(affiliation?: string) {
  const parts = (affiliation ?? "").split("·").map((p) => p.trim()).filter(Boolean);
  const nim = parts.find((p) => /^NIM\/NIP/i.test(p));
  const year = parts.find((p) => /^Angkatan/i.test(p));
  const rest = parts.filter((p) => p !== nim && p !== year);
  // Institution comes first, the study program second; the sheet shows the program above the institution.
  const [institution, ...others] = rest;
  return { nim, year, lines: others.length ? [...others, institution].filter(Boolean) : [institution].filter(Boolean) };
}

export async function MemberCard({ data }: { data: MemberCardData }) {
  const qr = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 320, color: { dark: "#0b1e20", light: "#ffffff" } });
  const { nim, year, lines } = splitAffiliation(data.affiliation);
  const host = data.verifyUrl.replace(/^https?:\/\//, "").split("/")[0];
  const path = data.verifyUrl.replace(/^https?:\/\/[^/]+/, "");
  const issuedYear = (data.issuedAt ? new Date(data.issuedAt) : new Date()).getFullYear();

  return (
    <div className="ms-print-root">
      <ScaledSheet>
        <div className="ms-sheet">
          <div className="ms-corner" />
          <div className="ms-hero">
            <div className="ms-tab">WITH CoE AILO</div>
            <div className="ms-brand">
              <div className="ms-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
                <img src="/logo-square.png" alt="AILO" />
              </div>
              <div className="ms-bt">
                <b>CoE AILO</b>
                <span>
                  Telkom University&apos;s
                  <br />
                  Center of Excellence
                </span>
              </div>
            </div>
            <h1>
              Advancing AI for
              <br />
              Learning &amp; Optimization.
            </h1>
            <div className="ms-notch" />
          </div>

          <div className="ms-wrap">
            <h2 className="ms-thx">Thank You for Your Membership!</h2>
            <div className="ms-intro">
              <div className="ms-lead">
                You are now a member of
                <br />
                CoE AILO — Telkom University
              </div>
              <p>
                Below is a digital version of your membership card for easy access to your membership information. Scan the QR code anytime to verify your current membership status.
              </p>
            </div>

            <div className="ms-card">
              <div className="ms-front">
                <div className="ms-year">{issuedYear}</div>
                <div className="ms-role">{data.category}</div>
                <div className="ms-who">
                  {data.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image
                    <img src={data.photo} alt={data.name} />
                  ) : (
                    <div className="ms-photo-empty">Photo</div>
                  )}
                  <div>
                    <div className="ms-name">{data.name.toUpperCase()}</div>
                    <div className="ms-meta">
                      Member # <b>{data.cardId}</b>
                      {nim && (
                        <>
                          <br />
                          {nim}
                        </>
                      )}
                      {lines.map((l) => (
                        <span key={l}>
                          <br />
                          {l}
                        </span>
                      ))}
                      {year && (
                        <>
                          <br />
                          {year}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ms-valid">Valid through {formatValidUntil(data.validUntil)}</div>
              </div>

              <div className="ms-back">
                <div className="ms-info">This card identifies a member of CoE AILO, Telkom University.</div>
                <div className="ms-fine">
                  Valid only with a current status on the verification page. This card is for the named member only and is non-transferable. If found, please return to the CoE AILO office.
                </div>
                <div className="ms-bottom">
                  <div className="ms-qr">
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI */}
                    <img src={qr} alt="Verification QR code" />
                  </div>
                  <div className="ms-contact">
                    <b>Scan to verify</b>
                    {host}
                    <br />
                    <span className="ms-id">{path}</span>
                    <br />
                    <br />
                    Telkom University
                    <br />
                    Bandung, Indonesia
                  </div>
                </div>
              </div>
            </div>

            <div className="ms-cols">
              <div>
                <h3>Vision</h3>
                <p className="ms-vision">{VISION}</p>
                <h3 className="ms-mission-h">Mission</h3>
                <ol>
                  {MISSION.map(([lead, rest]) => (
                    <li key={lead}>
                      <b>{lead}</b> {rest}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3>Member Benefits</h3>
                {BENEFITS.map(([title, text]) => (
                  <div key={title} className="ms-ben">
                    <b>{title}</b>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ms-foot">Verify your membership anytime at {host}</div>
        </div>
      </ScaledSheet>
    </div>
  );
}
