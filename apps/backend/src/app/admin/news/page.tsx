import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

import { deleteNewsAction } from "./actions";

export const dynamic = "force-dynamic";

type NewsItem = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  summary?: string;
  images?: string[];
  status: "draft" | "review" | "published";
  updatedAt: string;
};

const STATUSES = ["all", "published", "draft", "review"] as const;

export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const current = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "all";

  await connectToDatabase();
  const all = (await News.find().sort({ updatedAt: -1 }).lean()) as unknown as NewsItem[];

  const counts = {
    all: all.length,
    published: all.filter((n) => n.status === "published").length,
    draft: all.filter((n) => n.status === "draft").length,
    review: all.filter((n) => n.status === "review").length,
  };

  const query = (q ?? "").toLowerCase().trim();
  const items = all
    .filter((n) => current === "all" || n.status === current)
    .filter((n) => !query || n.title.toLowerCase().includes(query));

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>News</h1>
          <p>Write, review and publish articles for the public site.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/admin/news/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New article
          </Link>
        </div>
      </div>

      <div className="admin2-stat-grid">
        <div className="admin2-stat-card">
          <span>All articles</span>
          <span>{counts.all}</span>
        </div>
        <div className="admin2-stat-card">
          <span>Published</span>
          <span>{counts.published}</span>
        </div>
        <div className="admin2-stat-card warn">
          <span>Drafts</span>
          <span>{counts.draft}</span>
        </div>
        <div className="admin2-stat-card">
          <span>In review</span>
          <span>{counts.review}</span>
        </div>
      </div>

      <section className="admin2-panel">
        <div className="admin2-panel-toolbar">
          <div className="admin2-tabs">
            {STATUSES.map((s) => (
              <Link key={s} href={`/admin/news?status=${s}`} className={`admin2-tab${current === s ? " active" : ""}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} <span className="count">{counts[s]}</span>
              </Link>
            ))}
          </div>
          <form className="admin2-search" action="/admin/news">
            <input type="hidden" name="status" value={current} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" name="q" placeholder="Search articles…" defaultValue={q} />
          </form>
        </div>

        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 150px 130px 150px 56px" }}>
          <span>ARTICLE</span>
          <span>CATEGORY</span>
          <span>STATUS</span>
          <span>UPDATED</span>
          <span></span>
        </div>

        {items.length === 0 && <p className="admin2-table-empty">No articles found.</p>}

        {items.map((item) => (
          <div key={item._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 150px 130px 150px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, paddingRight: 20 }}>
              {item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                <img src={item.images[0]} alt="" className="admin2-thumb" />
              ) : (
                <div className="admin2-thumb">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M21 16l-5-5-9 9" />
                  </svg>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <Link href={`/admin/news/${item._id}`} style={{ fontSize: 15, fontWeight: 700, color: "#15201f", lineHeight: 1.35 }}>
                  {item.title}
                </Link>
                <span style={{ fontSize: 13, color: "#6b7573" }}>{item.summary || "No summary yet"}</span>
              </div>
            </div>
            <span style={{ fontSize: 14, color: "#3b4947" }}>{item.category}</span>
            <span className={`admin2-pill ${item.status}`}>
              <span className="dot" />
              {item.status === "draft" ? "Draft" : item.status === "review" ? "In review" : "Published"}
            </span>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
            <form action={deleteNewsAction}>
              <input type="hidden" name="id" value={item._id} />
              <button type="submit" aria-label="Delete article" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                </svg>
              </button>
            </form>
          </div>
        ))}

        <div className="admin2-pagination">
          <span>
            Showing {items.length} of {counts.all} article{counts.all === 1 ? "" : "s"}
          </span>
        </div>
      </section>
    </div>
  );
}
