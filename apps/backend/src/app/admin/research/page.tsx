import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";
import { User } from "@/models/User";

import { ListSortSelect } from "@/components/admin/ListSortSelect";
import { ListViewToggle } from "@/components/admin/ListViewToggle";
import { StatusBoard } from "@/components/admin/StatusBoard";
import { parseSort, sortItems, STATUS_LABEL } from "@/lib/cmsList";

import { deleteResearchAction, setResearchArchivedAction } from "./actions";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type ResearchItem = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  status: "draft" | "review" | "published" | "archived";
  owner?: string;
  updatedAt: string;
};

const STATUSES = ["all", "review", "published", "draft", "archived"] as const;

export default async function AdminResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; view?: string }>;
}) {
  const { status, q, sort, view } = await searchParams;
  const sortKey = parseSort(sort);
  const isBoard = view === "board";
  const current = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "all";

  await connectToDatabase();
  const all = (await Research.find().sort({ updatedAt: -1 }).lean()) as unknown as ResearchItem[];

  // Lecturer names for items submitted from the dosen dashboard.
  const ownerIds = Array.from(new Set(all.map((r) => r.owner).filter(Boolean).map(String)));
  const owners = new Map(
    ((await User.find({ _id: { $in: ownerIds } }).select("name").lean()) as unknown as { _id: string; name: string }[]).map((u) => [String(u._id), u.name]),
  );

  const counts = {
    all: all.length,
    review: all.filter((r) => r.status === "review").length,
    published: all.filter((r) => r.status === "published").length,
    draft: all.filter((r) => r.status === "draft").length,
    archived: all.filter((r) => r.status === "archived").length,
  };

  const query = (q ?? "").toLowerCase().trim();
  const matches = all.filter((r) => !query || r.title.toLowerCase().includes(query));
  const items = sortItems(
    matches.filter((r) => current === "all" || r.status === current),
    sortKey,
  );
  const baseParams = { status: current === "all" ? undefined : current, q: q || undefined, sort: sort || undefined };
  const boardColumns = (["draft", "review", "published", "archived"] as const).map((key) => ({
    key,
    label: STATUS_LABEL[key],
    items: sortItems(matches.filter((r) => r.status === key), sortKey).map((r) => ({ id: String(r._id), title: r.title, subtitle: `/research/${r.slug}`, href: `/admin/research/${r._id}` })),
  }));

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
              <Link key={s} href={`/admin/research?status=${s}${sort ? `&sort=${sort}` : ""}${isBoard ? "&view=board" : ""}`} className={`admin2-tab${current === s ? " active" : ""}`}>
                {s === "all" ? "All" : STATUS_LABEL[s]} <span className="count">{counts[s]}</span>
              </Link>
            ))}
          </div>
          <ListSortSelect basePath="/admin/research" params={{ ...baseParams, view: isBoard ? "board" : undefined }} value={sortKey} />
          <ListViewToggle basePath="/admin/research" params={baseParams} view={isBoard ? "board" : "list"} />
          <form className="admin2-search" action="/admin/research">
            <input type="hidden" name="status" value={current} />
            <input type="hidden" name="sort" value={sortKey} />
            {isBoard && <input type="hidden" name="view" value="board" />}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" name="q" placeholder="Search…" defaultValue={q} />
          </form>
        </div>

        {isBoard ? (
          <StatusBoard columns={boardColumns} />
        ) : (
          <>
        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 190px" }}>
          <span>TITLE</span>
          <span>STATUS</span>
          <span>UPDATED</span>
          <span></span>
        </div>

        {items.length === 0 && <EmptyState title="No research found" message="Nothing matches this view yet. Try another filter, or add a research topic." actionHref="/admin/research/new" actionLabel="New research" />}

        {items.map((item) => (
          <div key={item._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 190px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                <img src={item.image} alt="" className="admin2-thumb" />
              ) : (
                <div className="admin2-thumb" />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Link href={`/admin/research/${item._id}`} style={{ fontSize: 15, fontWeight: 700, color: "#15201f" }}>
                  {item.title}
                </Link>
                <span style={{ fontSize: 13, color: "#6b7573" }}>
                  /research/{item.slug}
                  {item.owner && owners.get(String(item.owner)) && <span className="msg-source" style={{ marginLeft: 8, fontSize: 11 }}>By {owners.get(String(item.owner))}</span>}
                </span>
              </div>
            </div>
            <span className={`admin2-pill ${item.status}`}>
              <span className="dot" />
              {STATUS_LABEL[item.status]}
            </span>
            <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {item.status === "published" && (
                <Link href={`/research/${item.slug}`} target="_blank" className="row-action">
                  View
                </Link>
              )}
              {item.status !== "review" && (
                <form action={setResearchArchivedAction}>
                  <input type="hidden" name="id" value={item._id} />
                  <input type="hidden" name="archive" value={item.status === "archived" ? "0" : "1"} />
                  <button type="submit" className="row-action">
                    {item.status === "archived" ? "Restore" : "Archive"}
                  </button>
                </form>
              )}
              <Link href={`/admin/research/${item._id}`} aria-label="Edit" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h4L19 9l-4-4L4 16z" />
                </svg>
              </Link>
              <form action={deleteResearchAction}>
                <input type="hidden" name="id" value={item._id} />
                <ConfirmSubmit title="Delete this research item?" message="It will be removed from the admin and the public site." confirmLabel="Delete" ariaLabel="Delete" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
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
            Showing {items.length} of {counts.all} research item{counts.all === 1 ? "" : "s"}
          </span>
        </div>
          </>
        )}
      </section>
    </div>
  );
}
