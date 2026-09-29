import Link from "next/link";
import { redirect } from "next/navigation";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

import { deleteUserAction } from "./actions";

export const dynamic = "force-dynamic";

type UserRow = { _id: string; name: string; email: string; role: string; photo?: string; member?: string };

const ROLE_LABEL: Record<string, string> = { super_admin: "Super admin", admin: "Admin", staff_lab: "Staff (lab)", borrower: "Borrower" };
const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: "#0b454c", color: "#fff" },
  admin: { bg: "#e3f1f1", color: "#0b454c" },
  staff_lab: { bg: "#e3f1f1", color: "#0b454c" },
  borrower: { bg: "#e1ecfa", color: "#1f4e8c" },
};

const TABS = ["all", "admins", "borrowers"] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/admin/dashboard?error=forbidden");
  }

  const { tab, q } = await searchParams;
  const currentTab = TABS.includes(tab as (typeof TABS)[number]) ? (tab as (typeof TABS)[number]) : "all";

  await connectToDatabase();
  const all = (await User.find().sort({ createdAt: -1 }).lean()) as unknown as UserRow[];

  const counts = {
    all: all.length,
    admins: all.filter((u) => u.role !== "borrower").length,
    borrowers: all.filter((u) => u.role === "borrower").length,
  };

  const query = (q ?? "").toLowerCase().trim();
  const items = all
    .filter((u) => (currentTab === "admins" ? u.role !== "borrower" : currentTab === "borrowers" ? u.role === "borrower" : true))
    .filter((u) => !query || `${u.name} ${u.email}`.toLowerCase().includes(query));

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Users</h1>
          <p>Admin, staff and borrower accounts.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/admin/users/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add user
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 24, alignItems: "start" }}>
        <section className="admin2-panel">
          <div className="admin2-panel-toolbar">
            <div className="admin2-tabs">
              {TABS.map((t) => (
                <Link key={t} href={`/admin/users?tab=${t}`} className={`admin2-tab${currentTab === t ? " active" : ""}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)} <span className="count">{counts[t]}</span>
                </Link>
              ))}
            </div>
            <form className="admin2-search" action="/admin/users">
              <input type="hidden" name="tab" value={currentTab} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input type="search" name="q" placeholder="Search name or email…" defaultValue={q} />
            </form>
          </div>

          <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 160px 96px" }}>
            <span>USER</span>
            <span>ROLE</span>
            <span></span>
          </div>

          {items.length === 0 && <p className="admin2-table-empty">No users found.</p>}

          {items.map((u) => {
            const isSelf = session.sub === u._id;
            const style = ROLE_STYLE[u.role] ?? ROLE_STYLE.admin;
            return (
              <div key={u._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 160px 96px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {u.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- uploaded profile photo
                    <img src={u.photo} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: u.role === "borrower" ? "#dde5f0" : "#f08a3c",
                      color: u.role === "borrower" ? "#1f4e8c" : "#1e1206",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                  )}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      {u.name} {isSelf && <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7573" }}>(you)</span>}
                    </span>
                    <span style={{ fontSize: 13, color: "#6b7573" }}>
                      {u.email}
                      {u.member && <span className="msg-source" style={{ marginLeft: 8, fontSize: 11 }}>Member</span>}
                    </span>
                  </div>
                </div>
                <span style={{ justifySelf: "start", fontSize: 12, fontWeight: 700, color: style.color, background: style.bg, borderRadius: 999, padding: "5px 10px" }}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Link href={`/admin/users/${u._id}`} aria-label="Edit user" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20h4L19 9l-4-4L4 16z" />
                    </svg>
                  </Link>
                  {!isSelf && (
                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={u._id} />
                      <ConfirmSubmit title="Delete this user?" message="They will no longer be able to sign in." confirmLabel="Delete" ariaLabel="Delete user" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#a32020" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                        </svg>
                      </ConfirmSubmit>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="admin2-section pad-sm">
          <h2>What each role can do</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: "#fff", background: "#0b454c", borderRadius: 999, padding: "4px 10px" }}>Super admin</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "#4e5957" }}>Everything, including users, settings and the chatbot&apos;s API key.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: "#0b454c", background: "#e3f1f1", borderRadius: 999, padding: "4px 10px" }}>Admin</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "#4e5957" }}>Content, labs, bookings and messages. No user or system settings.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: "#1f4e8c", background: "#e1ecfa", borderRadius: 999, padding: "4px 10px" }}>Borrower</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: "#4e5957" }}>Public account that can request lab and device bookings. No admin access.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
