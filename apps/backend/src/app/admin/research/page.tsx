import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

import { deleteResearchAction } from "./actions";

export const dynamic = "force-dynamic";

type ResearchItem = {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  status: "draft" | "published";
  updatedAt: string;
};

const STATUSES = ["all", "published", "draft"] as const;

export default async function AdminResearchPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const current = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "all";

  await connectToDatabase();
  const all = (await Research.find().sort({ updatedAt: -1 }).lean()) as unknown as ResearchItem[];

  const counts = {
    all: all.length,
    published: all.filter((r) => r.status === "published").length,
    draft: all.filter((r) => r.status === "draft").length,
  };

  const query = (q ?? "").toLowerCase().trim();
  const items = all
    .filter((r) => current === "all" || r.status === current)
    .filter((r) => !query || r.title.toLowerCase().includes(query));

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Research</h1>
          <p>Research topics and publications shown on the public site.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/admin/research/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New research
          </Link>
        </div>
      </div>

      <section className="admin2-panel">
        <div className="admin2-panel-toolbar">
          <div className="admin2-tabs">
            {STATUSES.map((s) => (
              <Link key={s} href={`/admin/research?status=${s}`} className={`admin2-tab${current === s ? " active" : ""}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} <span className="count">{counts[s]}</span>
              </Link>
            ))}
          </div>
          <form className="admin2-search" action="/admin/research">
            <input type="hidden" name="status" value={current} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" name="q" placeholder="Search…" defaultValue={q} />
          </form>
        </div>

        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 96px" }}>
          <span>TITLE</span>
          <span>STATUS</span>
          <span>UPDATED</span>
          <span></span>
        </div>

        {items.length === 0 && <p className="admin2-table-empty">No research found.</p>}

        {items.map((item) => (
          <div key={item._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 96px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                <img src={item.image} alt="" className="admin2-thumb" />
              ) : (
                <div className="admin2-thumb" />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
                <span style={{ fontSize: 13, color: "#6b7573" }}>/research/{item.slug}</span>
              </div>
            </div>
            <span className={`admin2-pill ${item.status}`}>
              <span className="dot" />
              {item.status === "draft" ? "Draft" : "Published"}
            </span>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <Link href={`/admin/research/${item._id}`} aria-label="Edit" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                </svg>
              </Link>
              <form action={deleteResearchAction}>
                <input type="hidden" name="id" value={item._id} />
                <button type="submit" aria-label="Delete" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        ))}

        <div className="admin2-pagination">
          <span>
            Showing {items.length} of {counts.all} research item{counts.all === 1 ? "" : "s"}
          </span>
        </div>
      </section>
    </div>
  );
}
