import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

import { ListSortSelect } from "@/components/admin/ListSortSelect";
import { ListViewToggle } from "@/components/admin/ListViewToggle";
import { StatusBoard } from "@/components/admin/StatusBoard";
import { parseSort, sortItems, STATUS_LABEL } from "@/lib/cmsList";

import { deleteNewsAction, setNewsArchivedAction } from "./actions";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type NewsItem = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  summary?: string;
  images?: string[];
  status: "draft" | "review" | "published" | "archived";
  updatedAt: string;
};

const STATUSES = ["all", "published", "draft", "review", "archived"] as const;

export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; sort?: string; view?: string }> }) {
  const { status, q, sort, view } = await searchParams;
  const sortKey = parseSort(sort);
  const isBoard = view === "board";
  const current = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "all";

  await connectToDatabase();
  const all = (await News.find().sort({ updatedAt: -1 }).lean()) as unknown as NewsItem[];

  const counts = {
    all: all.length,
    published: all.filter((n) => n.status === "published").length,
    draft: all.filter((n) => n.status === "draft").length,
    review: all.filter((n) => n.status === "review").length,
    archived: all.filter((n) => n.status === "archived").length,
  };

  const query = (q ?? "").toLowerCase().trim();
  const matches = all.filter((n) => !query || n.title.toLowerCase().includes(query));
  const items = sortItems(
    matches.filter((n) => current === "all" || n.status === current),
    sortKey,
  );
  const baseParams = { status: current === "all" ? undefined : current, q: q || undefined, sort: sort || undefined };
  const boardColumns = (["draft", "review", "published", "archived"] as const).map((key) => ({
    key,
    label: STATUS_LABEL[key],
    items: sortItems(matches.filter((n) => n.status === key), sortKey).map((n) => ({ id: String(n._id), title: n.title, subtitle: n.category, href: `/admin/news/${n._id}` })),
  }));

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
              <Link key={s} href={`/admin/news?status=${s}${sort ? `&sort=${sort}` : ""}${isBoard ? "&view=board" : ""}`} className={`admin2-tab${current === s ? " active" : ""}`}>
                {s === "all" ? "All" : STATUS_LABEL[s]} <span className="count">{counts[s]}</span>
              </Link>
            ))}
          </div>
          <ListSortSelect basePath="/admin/news" params={{ ...baseParams, view: isBoard ? "board" : undefined }} value={sortKey} />
          <ListViewToggle basePath="/admin/news" params={baseParams} view={isBoard ? "board" : "list"} />
          <form className="admin2-search" action="/admin/news">
            <input type="hidden" name="status" value={current} />
            <input type="hidden" name="sort" value={sortKey} />
            {isBoard && <input type="hidden" name="view" value="board" />}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" name="q" placeholder="Search articles…" defaultValue={q} />
          </form>
        </div>

        {isBoard ? (
          <StatusBoard columns={boardColumns} />
        ) : (
          <>
        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 150px 130px 150px 170px" }}>
          <span>ARTICLE</span>
          <span>CATEGORY</span>
          <span>STATUS</span>
          <span>UPDATED</span>
          <span></span>
        </div>

        {items.length === 0 && <EmptyState title="No articles found" message="Nothing matches this view yet. Try another filter, or write a new article." actionHref="/admin/news/new" actionLabel="New article" />}

        {items.map((item) => (
          <div key={item._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 150px 130px 150px 170px" }}>
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
              {STATUS_LABEL[item.status]}
            </span>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {item.status === "published" && (
                <Link href={`/news/${item.slug}`} target="_blank" className="row-action">
                  View
                </Link>
              )}
              {item.status !== "review" && (
                <form action={setNewsArchivedAction}>
                  <input type="hidden" name="id" value={item._id} />
                  <input type="hidden" name="archive" value={item.status === "archived" ? "0" : "1"} />
                  <button type="submit" className="row-action">
                    {item.status === "archived" ? "Restore" : "Archive"}
                  </button>
                </form>
              )}
            <form action={deleteNewsAction}>
              <input type="hidden" name="id" value={item._id} />
              <ConfirmSubmit title="Delete this article?" message="It will be removed from the admin and the public site." confirmLabel="Delete" ariaLabel="Delete article" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                </svg>
              </ConfirmSubmit>
            </form>
            </div>
          </div>
        ))}

        <div className="admin2-pagination">
          <span>
            Showing {items.length} of {counts.all} article{counts.all === 1 ? "" : "s"}
          </span>
        </div>
          </>
        )}
      </section>
    </div>
  );
}
