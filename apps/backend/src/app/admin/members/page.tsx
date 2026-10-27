import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { getBaseUrl } from "@/lib/baseUrl";
import { connectToDatabase } from "@/lib/mongodb";
import { listMemberFaculties } from "@/lib/memberFacultiesDb";
import { listTeamCategories } from "@/lib/teamCategoriesDb";
import { MEMBER_CATEGORIES, Member } from "@/models/Member";
import { MemberCard } from "@/components/MemberCard";
import { teamCategoryFor } from "@/lib/teamBoardSync";

import { ImageUploadField } from "@/components/ImageUploadField";

import { approveMemberAction, deleteMemberAction, rejectMemberAction, resendCardEmailAction, revokeMemberAction, setMemberTeamBoardAction, updateMemberAction } from "./actions";

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
  studyLevel?: string;
  faculty?: string;
  referee?: string;
  works?: { kind?: string; title: string; year?: number; url?: string }[];
  cardId?: string;
  validUntil?: string;
  createdAt: string;
  includeInTeamBoard?: boolean;
  teamCategory?: string;
  teamCategories?: string[];
};

const STATUSES = ["pending", "approved", "rejected", "expired"] as const;
const STUDY_LEVELS = ["S1", "S2", "S3"] as const;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; id?: string; level?: string; faculty?: string }>;
}) {
  const { status, q, id, level, faculty } = await searchParams;
  const current = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "pending";

  await connectToDatabase();
  const teamCategories = await listTeamCategories();
  const memberFaculties = await listMemberFaculties();
  const all = (await Member.find().sort({ createdAt: -1 }).lean()) as unknown as MemberItem[];

  const counts: Record<string, number> = {};
  for (const s of STATUSES) counts[s] = all.filter((m) => m.status === s).length;

  // Scoped to the current status tab, before the level/faculty/search filters -
  // so the filter chips show how many are available to narrow down to, not how
  // many are left after narrowing.
  const inTab = all.filter((m) => m.status === current);
  const levelCounts: Record<string, number> = {};
  for (const l of STUDY_LEVELS) levelCounts[l] = inTab.filter((m) => m.studyLevel === l).length;
  const facultyCounts: Record<string, number> = {};
  for (const f of memberFaculties) facultyCounts[f] = inTab.filter((m) => m.faculty === f).length;
  const currentLevel = STUDY_LEVELS.includes(level as (typeof STUDY_LEVELS)[number]) ? level : undefined;
  const currentFaculty = faculty && memberFaculties.includes(faculty) ? faculty : undefined;

  const query = (q ?? "").toLowerCase().trim();
  const items = inTab
    .filter((m) => !currentLevel || m.studyLevel === currentLevel)
    .filter((m) => !currentFaculty || m.faculty === currentFaculty)
    .filter((m) => !query || `${m.name} ${m.email} ${m.affiliation} ${m.faculty ?? ""}`.toLowerCase().includes(query));

  const selected = (id ? all.find((m) => String(m._id) === id) : items[0]) ?? null;
  const baseUrl = selected?.cardId ? await getBaseUrl() : null;

  const filterParams = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    params.set("status", current);
    if (q) params.set("q", q);
    if (currentLevel) params.set("level", currentLevel);
    if (currentFaculty) params.set("faculty", currentFaculty);
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return params.toString();
  };

  return (
    <div className="admin2-page">
      <div className="admin2-header">
        <div>
          <h1>Members</h1>
          <p>Review sign-ups from the public site. Approving one generates and sends a digital member card. You can also add a member yourself.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/admin/members/new" className="admin2-btn">
            Add member
          </Link>
          <Link href="/admin/members/faculties" className="admin2-btn outline">
            Manage faculties
          </Link>
          <a href={`/api/admin/members/export?status=${current}`} className="admin2-btn outline">
            Export CSV
          </a>
        </div>
      </div>

      <div className="admin2-split-460 admin2-fill">
        <section className="admin2-panel" style={{ display: "flex", flexDirection: "column" }}>
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
              {currentLevel && <input type="hidden" name="level" value={currentLevel} />}
              {currentFaculty && <input type="hidden" name="faculty" value={currentFaculty} />}
              <input type="search" name="q" placeholder="Search…" defaultValue={q} style={{ width: 180, height: 38, paddingLeft: 12 }} />
            </form>
          </div>

          {(Object.values(levelCounts).some((n) => n > 0) || Object.values(facultyCounts).some((n) => n > 0)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 16px 14px", borderBottom: "1px solid #eeece6" }}>
              {Object.values(levelCounts).some((n) => n > 0) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#9aa3a0", textTransform: "uppercase", letterSpacing: "0.03em", width: 52 }}>Level</span>
                  <Link href={`/admin/members?${filterParams({ level: undefined })}`} className={`admin2-chip${!currentLevel ? " active" : ""}`}>
                    All
                  </Link>
                  {STUDY_LEVELS.filter((l) => levelCounts[l] > 0).map((l) => (
                    <Link key={l} href={`/admin/members?${filterParams({ level: currentLevel === l ? undefined : l })}`} className={`admin2-chip${currentLevel === l ? " active" : ""}`}>
                      {l} <span className="count">{levelCounts[l]}</span>
                    </Link>
                  ))}
                </div>
              )}
              {Object.values(facultyCounts).some((n) => n > 0) && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#9aa3a0", textTransform: "uppercase", letterSpacing: "0.03em", width: 52 }}>Faculty</span>
                  <Link href={`/admin/members?${filterParams({ faculty: undefined })}`} className={`admin2-chip${!currentFaculty ? " active" : ""}`}>
                    All
                  </Link>
                  {memberFaculties.filter((f) => facultyCounts[f] > 0).map((f) => (
                    <Link key={f} href={`/admin/members?${filterParams({ faculty: currentFaculty === f ? undefined : f })}`} className={`admin2-chip${currentFaculty === f ? " active" : ""}`} title={f}>
                      {f.replace(/^Fakultas /, "").replace(/\s*\([^)]*\)$/, "")} <span className="count">{facultyCounts[f]}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="admin2-scroll">
          {items.length === 0 && <p className="admin2-table-empty">No {current} applications match these filters.</p>}

          {items.map((m) => (
            <Link
              key={m._id}
              href={`/admin/members?${filterParams({ id: m._id })}`}
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
                <span style={{ fontSize: 13, color: "#6b7573", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0b454c", background: "#e3f1f1", borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>
                {m.approvedAs ?? m.requestedAs}
              </span>
              <span style={{ fontSize: 13, color: "#6b7573", width: 70, textAlign: "right", flexShrink: 0 }}>{new Date(m.createdAt).toLocaleDateString("en-GB")}</span>
            </Link>
          ))}
          </div>
        </section>

        <section className="admin2-panel" style={{ display: "flex", flexDirection: "column" }}>
          {!selected ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7573", fontSize: 14 }}>Select an applicant to review.</div>
          ) : (
            <>
              <div style={{ padding: "20px 22px", display: "flex", gap: 14, alignItems: "center", borderBottom: "1px solid #eeece6", flexShrink: 0 }}>
                {selected.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                  <img src={selected.photo} alt="" style={{ width: 52, height: 52, borderRadius: 999, objectFit: "cover" }} />
                ) : (
                  <span style={{ width: 52, height: 52, borderRadius: 999, background: "#dde5f0", color: "#1f4e8c", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{selected.name}</span>
                  <span style={{ fontSize: 13, color: "#6b7573", overflowWrap: "anywhere" }}>{selected.email}</span>
                </div>
                <span className={`admin2-pill ${selected.status}`} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                  <span className="dot" />
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </span>
              </div>

              <div className="admin2-scroll">
              {selected.status === "pending" && (
                <form action={approveMemberAction} style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <input type="hidden" name="id" value={selected._id} />
                  <div style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr)", gap: "10px 12px", fontSize: 14 }}>
                    <span style={{ color: "#6b7573" }}>Requested as</span>
                    <span style={{ fontWeight: 600 }}>{selected.requestedAs}</span>
                    <span style={{ color: "#6b7573" }}>Affiliation</span>
                    <span style={{ fontWeight: 600 }}>{selected.affiliation}</span>
                    <span style={{ color: "#6b7573" }}>Study level</span>
                    <span style={{ fontWeight: 600 }}>{selected.studyLevel || "Not applicable"}</span>
                    <span style={{ color: "#6b7573" }}>Referee Dosen</span>
                    <span style={{ fontWeight: 600 }}>{selected.referee || "Not provided"}</span>
                    {(selected.works?.length ?? 0) > 0 && (
                      <>
                        <span style={{ color: "#6b7573" }}>Karya</span>
                        <span style={{ fontWeight: 600, display: "flex", flexDirection: "column", gap: 4 }}>
                          {selected.works!.map((w, i) => (
                            <span key={i}>
                              {w.url ? (
                                <a href={w.url} target="_blank" rel="noopener noreferrer">
                                  {w.title}
                                </a>
                              ) : (
                                w.title
                              )}
                              {w.year ? ` (${w.year})` : ""}
                            </span>
                          ))}
                        </span>
                      </>
                    )}
                    <span style={{ color: "#6b7573" }}>Phone</span>
                    <span style={{ fontWeight: 600 }}>{selected.phone || "Not provided"}</span>
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
                      <span style={{ fontSize: 12, lineHeight: 1.4, color: "#6b7573" }}>&quot;Dosen&quot; also creates a lecturer dashboard account.</span>
                    </div>
                    <div className="admin2-field">
                      <label htmlFor="validUntil">Valid until</label>
                      <input id="validUntil" name="validUntil" type="date" required min={new Date().toISOString().slice(0, 10)} style={{ height: 42 }} />
                      <span style={{ fontSize: 12, lineHeight: 1.4, color: "#6b7573" }}>Required. The card expires on this date.</span>
                    </div>
                  </div>
                  <div className="admin2-field">
                    <label htmlFor="faculty">
                      Faculty <span style={{ fontWeight: 500, color: "#6b7573" }}>(if not already set by the applicant)</span>
                    </label>
                    <select id="faculty" name="faculty" defaultValue={selected.faculty ?? ""} style={{ height: 42 }}>
                      <option value="">Not applicable</option>
                      {memberFaculties.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin2-field">
                    <label htmlFor="reviewNote">
                      Note to applicant <span style={{ fontWeight: 500, color: "#6b7573" }}>(required when rejecting)</span>
                    </label>
                    <textarea id="reviewNote" name="reviewNote" rows={2} maxLength={300} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" formAction={rejectMemberAction} formNoValidate className="admin2-btn danger" style={{ height: 46 }}>
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
                        issuedAt: selected.createdAt,
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
                      <ConfirmSubmit title="Revoke this membership?" message="The member card will show as expired on the verification page." confirmLabel="Revoke" className="admin2-btn danger" style={{ height: 42, fontSize: 13, width: "100%" }}>
                        Revoke
                      </ConfirmSubmit>
                    </form>
                  </div>

                  <form action={setMemberTeamBoardAction} className="team-board-toggle">
                    <input type="hidden" name="id" value={selected._id} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, flexGrow: 1 }}>Team Board</span>
                      {selected.includeInTeamBoard && (
                        <Link href="/team" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: "#00809d" }}>
                          View on site
                        </Link>
                      )}
                    </div>
                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
                      <input type="checkbox" name="include" defaultChecked={selected.includeInTeamBoard} style={{ width: 18, height: 18 }} />
                      Show this member on the public Team page
                    </label>
                    <div className="admin2-field" style={{ paddingLeft: 28 }}>
                      <label>
                        Categories <span style={{ fontWeight: 500, color: "#6b7573" }}>(tick all that apply; used only when shown above)</span>
                      </label>
                      {teamCategories.map((cat) => {
                        const chosen = selected.teamCategories?.length ? selected.teamCategories : [selected.teamCategory ?? teamCategoryFor(selected.approvedAs ?? selected.requestedAs, selected.studyLevel, teamCategories)];
                        return (
                          <label key={cat} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
                            <input type="checkbox" name="teamCategories" value={cat} defaultChecked={chosen.includes(cat)} style={{ width: 18, height: 18 }} />
                            {cat}
                          </label>
                        );
                      })}
                    </div>
                    <button type="submit" className="admin2-btn outline" style={{ height: 40, alignSelf: "flex-start" }}>
                      Save
                    </button>
                  </form>
                </div>
              )}

              {(selected.status === "rejected" || selected.status === "expired") && (
                <div style={{ padding: "20px 22px", fontSize: 14, color: "#6b7573" }}>
                  This application is {selected.status}.
                </div>
              )}

              {(selected.status === "approved" || selected.status === "expired") && (
                <details style={{ margin: "0 22px 16px", borderTop: "1px solid #ece9e1", paddingTop: 16 }}>
                  <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Edit member details</summary>
                  <form action={updateMemberAction} key={selected._id} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                    <input type="hidden" name="id" value={selected._id} />
                    <div className="admin2-field">
                      <label htmlFor="edit-name">Full name</label>
                      <input id="edit-name" name="name" type="text" required defaultValue={selected.name} style={{ height: 42 }} />
                    </div>
                    <div className="admin2-field">
                      <label htmlFor="edit-affiliation">Affiliation</label>
                      <input id="edit-affiliation" name="affiliation" type="text" required defaultValue={selected.affiliation} style={{ height: 42 }} />
                    </div>
                    <div className="admin2-field">
                      <label htmlFor="edit-phone">Phone</label>
                      <input id="edit-phone" name="phone" type="text" defaultValue={selected.phone ?? ""} style={{ height: 42 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                      <div className="admin2-field">
                        <label htmlFor="edit-faculty">Faculty</label>
                        <select id="edit-faculty" name="faculty" defaultValue={selected.faculty ?? ""} style={{ height: 42 }}>
                          <option value="">Not applicable</option>
                          {memberFaculties.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="admin2-field">
                        <label htmlFor="edit-studyLevel">Study level</label>
                        <select id="edit-studyLevel" name="studyLevel" defaultValue={selected.studyLevel ?? ""} style={{ height: 42 }}>
                          <option value="">Not applicable</option>
                          {STUDY_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                      <div className="admin2-field">
                        <label htmlFor="edit-approvedAs">Member category</label>
                        <select id="edit-approvedAs" name="approvedAs" defaultValue={selected.approvedAs ?? selected.requestedAs} style={{ height: 42 }}>
                          {MEMBER_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="admin2-field">
                        <label htmlFor="edit-validUntil">Valid until</label>
                        <input id="edit-validUntil" name="validUntil" type="date" required defaultValue={selected.validUntil ? new Date(selected.validUntil).toISOString().slice(0, 10) : ""} style={{ height: 42 }} />
                      </div>
                    </div>
                    <div className="admin2-field">
                      <label htmlFor="edit-referee">
                        Referee Dosen <span style={{ fontWeight: 500, color: "#6b7573" }}>(supervising lecturer, shown on the student&apos;s profile)</span>
                      </label>
                      <input id="edit-referee" name="referee" type="text" maxLength={160} defaultValue={selected.referee ?? ""} style={{ height: 42 }} />
                    </div>
                    <ImageUploadField name="photo" label="Photo" defaultValue={selected.photo} hint="Shown on the member card" />
                    <p style={{ margin: 0, fontSize: 12.5, color: "#6b7573" }}>The email and card ID stay the same. Name, photo and referee are also updated on the member&apos;s Team Board profile. Changing the category moves their Team profile too, and switches the lecturer login off (or on) as needed.</p>
                    <button type="submit" className="admin2-btn" style={{ height: 44, alignSelf: "flex-start" }}>
                      Save changes
                    </button>
                  </form>
                </details>
              )}

              </div>

              <div style={{ margin: "0 22px 22px", paddingTop: 16, borderTop: "1px solid #ece9e1", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
                <span style={{ flex: 1, fontSize: 12.5, color: "#6b7573", minWidth: 200 }}>Deleting removes this record for good. Use Revoke instead if the card should only stop being valid.</span>
                <form action={deleteMemberAction}>
                  <input type="hidden" name="id" value={selected._id} />
                  <ConfirmSubmit
                    title={`Delete ${selected.name}?`}
                    message="This permanently deletes the member record and card. Their Team Board profile is hidden, and any lecturer login stays as it is. This cannot be undone."
                    confirmLabel="Delete member"
                    ariaLabel="Delete member"
                    className="admin2-btn danger"
                    style={{ height: 42, fontSize: 13 }}
                  >
                    Delete member
                  </ConfirmSubmit>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
