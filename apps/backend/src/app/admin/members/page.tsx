import Link from "next/link";

import { getBaseUrl } from "@/lib/baseUrl";
import { connectToDatabase } from "@/lib/mongodb";
import { MEMBER_CATEGORIES, Member } from "@/models/Member";
import { MemberCard } from "@/components/MemberCard";

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
  searchParams: Promise<{ status?: string; q?: string; id?: string }>;
}) {
  const { status, q, id } = await searchParams;
  const current = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "pending";

  await connectToDatabase();
  const all = (await Member.find().sort({ createdAt: -1 }).lean()) as unknown as MemberItem[];

  const counts: Record<string, number> = {};
  for (const s of STATUSES) counts[s] = all.filter((m) => m.status === s).length;

  const query = (q ?? "").toLowerCase().trim();
  const items = all
    .filter((m) => m.status === current)
    .filter((m) => !query || `${m.name} ${m.email}`.toLowerCase().includes(query));

  const selected = (id ? all.find((m) => m._id === id) : items[0]) ?? null;
  const baseUrl = selected?.cardId ? await getBaseUrl() : null;

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Members</h1>
          <p>Review sign-ups from the public site. Approving one generates and sends a digital member card.</p>
        </div>
        <div className="admin2-actions">
          <a href={`/api/admin/members/export?status=${current}`} className="admin2-btn outline">
            Export CSV
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 460px", gap: 24, alignItems: "start" }}>
        <section className="admin2-panel">
          <div className="admin2-panel-toolbar" style={{ padding: "14px 16px" }}>
            <div className="admin2-tabs">
              {STATUSES.map((s) => (
                <Link key={s} href={`/admin/members?status=${s}`} className={`admin2-tab${current === s ? " active" : ""}`} style={current === s ? { background: "#fdebd7", color: "#5e3509" } : undefined}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} <span className="count">{counts[s]}</span>
                </Link>
              ))}
            </div>
            <form className="admin2-search" action="/admin/members" style={{ marginLeft: "auto" }}>
              <input type="hidden" name="status" value={current} />
              <input type="search" name="q" placeholder="Search…" defaultValue={q} style={{ width: 180, height: 38, paddingLeft: 12 }} />
            </form>
          </div>

          {items.length === 0 && <p className="admin2-table-empty">No {current} applications.</p>}

          {items.map((m) => (
            <Link
              key={m._id}
              href={`/admin/members?status=${current}${q ? `&q=${q}` : ""}&id=${m._id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderTop: "1px solid #eeece6",
                textDecoration: "none",
                color: "#15201f",
                background: selected?._id === m._id ? "#f2f9f9" : "transparent",
              }}
            >
              {m.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                <img src={m.photo} alt="" style={{ width: 42, height: 42, borderRadius: 999, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, background: "#dde5f0", color: "#1f4e8c", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0, textAlign: "left" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#15201f" }}>{m.name}</span>
                <span style={{ fontSize: 13, color: "#6b7573" }}>{m.email}</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0b454c", background: "#e3f1f1", borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>
                {m.approvedAs ?? m.requestedAs}
              </span>
              <span style={{ fontSize: 13, color: "#6b7573", width: 70, textAlign: "right", flexShrink: 0 }}>{new Date(m.createdAt).toLocaleDateString("en-GB")}</span>
            </Link>
          ))}
        </section>

        <section className="admin2-panel" style={{ display: "flex", flexDirection: "column" }}>
          {!selected ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7573", fontSize: 14 }}>Select an applicant to review.</div>
          ) : (
            <>
              <div style={{ padding: "20px 22px", display: "flex", gap: 14, alignItems: "center", borderBottom: "1px solid #eeece6" }}>
                {selected.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                  <img src={selected.photo} alt="" style={{ width: 52, height: 52, borderRadius: 999, objectFit: "cover" }} />
                ) : (
                  <span style={{ width: 52, height: 52, borderRadius: 999, background: "#dde5f0", color: "#1f4e8c", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{selected.name}</span>
                  <span style={{ fontSize: 13, color: "#6b7573" }}>{selected.email}</span>
                </div>
                <span className={`admin2-pill ${selected.status}`}>
                  <span className="dot" />
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>

              {selected.status === "pending" && (
                <form action={approveMemberAction} style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <input type="hidden" name="id" value={selected._id} />
                  <div style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr)", gap: "10px 12px", fontSize: 14 }}>
                    <span style={{ color: "#6b7573" }}>Requested as</span>
                    <span style={{ fontWeight: 600 }}>{selected.requestedAs}</span>
                    <span style={{ color: "#6b7573" }}>Affiliation</span>
                    <span style={{ fontWeight: 600 }}>{selected.affiliation}</span>
                    <span style={{ color: "#6b7573" }}>Phone</span>
                    <span style={{ fontWeight: 600 }}>{selected.phone}</span>
                    <span style={{ color: "#6b7573" }}>Submitted</span>
                    <span style={{ fontWeight: 600 }}>{new Date(selected.createdAt).toLocaleString("en-GB")}</span>
                    <span style={{ color: "#6b7573" }}>Proof</span>
                    {selected.proofDocument ? (
                      <a href={selected.proofDocument} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
                        View document
                      </a>
                    ) : (
                      <span style={{ color: "#6b7573" }}>Not provided</span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 12, background: "#f7f6f2" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Verification</span>
                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
                      <input type="checkbox" name="nameMatches" style={{ width: 18, height: 18 }} />
                      Name matches the proof document
                    </label>
                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
                      <input type="checkbox" name="affiliationConfirmed" style={{ width: 18, height: 18 }} />
                      Affiliation confirmed
                    </label>
                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
                      <input type="checkbox" name="photoSuitable" style={{ width: 18, height: 18 }} />
                      Photo suitable for the card
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <div className="admin2-field">
                      <label htmlFor="approvedAs">Approve as</label>
                      <select id="approvedAs" name="approvedAs" defaultValue={selected.requestedAs} style={{ height: 42 }}>
                        {MEMBER_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin2-field">
                      <label htmlFor="validUntil">Valid until (leave empty for no expiry)</label>
                      <input id="validUntil" name="validUntil" type="date" style={{ height: 42 }} />
                    </div>
                  </div>
                  <div className="admin2-field">
                    <label htmlFor="reviewNote">
                      Note to applicant <span style={{ fontWeight: 500, color: "#6b7573" }}>(required when rejecting)</span>
                    </label>
                    <textarea id="reviewNote" name="reviewNote" rows={2} maxLength={300} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" formAction={rejectMemberAction} className="admin2-btn danger" style={{ height: 46 }}>
                      Reject
                    </button>
                    <button type="submit" className="admin2-btn" style={{ flexGrow: 1, height: 46, justifyContent: "center" }}>
                      Approve &amp; generate card
                    </button>
                  </div>
                </form>
              )}

              {selected.status === "approved" && (
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 12, background: "#e6f4ec", color: "#17603a", fontSize: 14, lineHeight: 1.5 }}>
                    <span>
                      Card <strong>{selected.cardId}</strong> issued for {selected.email}.
                    </span>
                  </div>
                  {baseUrl && (
                    <MemberCard
                      data={{
                        name: selected.name,
                        cardId: selected.cardId!,
                        category: selected.approvedAs ?? selected.requestedAs,
                        affiliation: selected.affiliation,
                        photo: selected.photo,
                        validUntil: selected.validUntil,
                        verifyUrl: `${baseUrl}/verify/${selected.cardId}`,
                      }}
                    />
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                    <Link href={`/admin/members/${selected._id}/card`} className="admin2-btn outline" style={{ height: 42, fontSize: 13, justifyContent: "center" }}>
                      Open card
                    </Link>
                    <form action={resendCardEmailAction}>
                      <input type="hidden" name="id" value={selected._id} />
                      <button type="submit" className="admin2-btn outline" style={{ height: 42, fontSize: 13, width: "100%" }}>
                        Resend email
                      </button>
                    </form>
                    <form action={revokeMemberAction}>
                      <input type="hidden" name="id" value={selected._id} />
                      <button type="submit" className="admin2-btn danger" style={{ height: 42, fontSize: 13, width: "100%" }}>
                        Revoke
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {(selected.status === "rejected" || selected.status === "expired") && (
                <div style={{ padding: "20px 22px", fontSize: 14, color: "#6b7573" }}>
                  This application is {selected.status}.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
