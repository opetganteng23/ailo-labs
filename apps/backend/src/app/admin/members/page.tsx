import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { MEMBER_CATEGORIES, Member } from "@/models/Member";

import { approveMemberAction, rejectMemberAction, resendCardEmailAction, revokeMemberAction } from "./actions";

export const dynamic = "force-dynamic";

type MemberItem = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  affiliation: string;
  requestedAs: string;
  approvedAs?: string;
  photo?: string;
  proofDocument?: string;
  status: "pending" | "approved" | "rejected" | "expired";
  cardId?: string;
  validUntil?: string;
  createdAt: string;
};

const STATUSES = ["pending", "approved", "rejected", "expired"] as const;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = status && STATUSES.includes(status as (typeof STATUSES)[number]) ? status : "pending";

  await connectToDatabase();
  const all = (await Member.find().sort({ createdAt: -1 }).lean()) as unknown as MemberItem[];
  const items = all.filter((m) => m.status === current);

  const counts: Record<string, number> = {};
  for (const s of STATUSES) counts[s] = all.filter((m) => m.status === s).length;

  return (
    <div>
      <h1>Member registrations</h1>
      <p style={{ color: "#5b6469", fontSize: 13 }}>Review applications and issue digital member cards.</p>

      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/members?status=${s}`} className={`btn ${current === s ? "" : "outline"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} {counts[s]}
          </Link>
        ))}
      </div>

      {items.length === 0 && <p className="notice">No {current} applications.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {items.map((m) => (
          <div key={m._id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", gap: 14 }}>
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                  <img src={m.photo} alt={m.name} className="avatar-thumb" style={{ width: 64, height: 64 }} />
                ) : (
                  <div className="avatar-thumb" style={{ width: 64, height: 64, background: "var(--paper-dim)" }} />
                )}
                <div>
                  <h3 style={{ fontSize: 16 }}>{m.name}</h3>
                  <p style={{ fontSize: 13, color: "#5b6469" }}>{m.email} - {m.phone}</p>
                  <p style={{ fontSize: 13, color: "#5b6469" }}>
                    Requested as <strong>{m.requestedAs}</strong> - {m.affiliation}
                  </p>
                  <p style={{ fontSize: 12, color: "#8f979a" }}>Submitted {new Date(m.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                {m.proofDocument && (
                  <a href={m.proofDocument} target="_blank" rel="noopener noreferrer" className="btn outline" style={{ fontSize: 12 }}>
                    View proof document
                  </a>
                )}
                {m.status === "approved" && m.cardId && (
                  <>
                    <span className="badge approved">{m.cardId}</span>
                    <Link href={`/admin/members/${m._id}/card`} className="btn outline" style={{ fontSize: 12 }}>
                      View digital card
                    </Link>
                  </>
                )}
              </div>
            </div>

            {current === "pending" && (
              <form action={approveMemberAction} style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <input type="hidden" name="id" value={m._id} />
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Verification</p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                  <label style={{ flexDirection: "row", alignItems: "center", gap: 6, display: "flex", fontWeight: 400 }}>
                    <input type="checkbox" name="nameMatches" style={{ width: "auto" }} /> Name matches the proof document
                  </label>
                  <label style={{ flexDirection: "row", alignItems: "center", gap: 6, display: "flex", fontWeight: 400 }}>
                    <input type="checkbox" name="affiliationConfirmed" style={{ width: "auto" }} /> Affiliation confirmed
                  </label>
                  <label style={{ flexDirection: "row", alignItems: "center", gap: 6, display: "flex", fontWeight: 400 }}>
                    <input type="checkbox" name="photoSuitable" style={{ width: "auto" }} /> Photo suitable for the card
                  </label>
                </div>
                <div className="grid cols-3">
                  <label>
                    Approve as
                    <select name="approvedAs" defaultValue={m.requestedAs}>
                      {MEMBER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Valid until (leave empty for no expiry)
                    <input name="validUntil" type="date" />
                  </label>
                  <label>
                    Note to applicant (optional)
                    <input name="reviewNote" maxLength={300} />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button type="submit" className="btn">
                    Approve
                  </button>
                  <button type="submit" formAction={rejectMemberAction} className="btn danger">
                    Reject
                  </button>
                </div>
              </form>
            )}

            {current === "approved" && (
              <div style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <form action={resendCardEmailAction}>
                  <input type="hidden" name="id" value={m._id} />
                  <button type="submit" className="btn outline">
                    Resend email
                  </button>
                </form>
                <form action={revokeMemberAction}>
                  <input type="hidden" name="id" value={m._id} />
                  <button type="submit" className="btn danger">
                    Revoke
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
