import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { User } from "@/models/User";

import { deleteProjectAction, publishProjectAction, setProjectArchivedAction } from "./actions";
import { ProjectsBoard } from "./ProjectsBoard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const isTable = view === "table";

  await connectToDatabase();
  const items = (await Project.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    title: string;
    status: "planned" | "ongoing" | "completed";
    description?: string;
    content?: string;
    images?: string[];
    updatedAt: string;
    publishStatus?: "review" | "published" | "archived";
    owner?: string;
  }[];
  const ownerIds = Array.from(new Set(items.map((p) => p.owner).filter(Boolean).map(String)));
  const owners = new Map(
    ((await User.find({ _id: { $in: ownerIds } }).select("name").lean()) as unknown as { _id: string; name: string }[]).map((u) => [String(u._id), u.name]),
  );
  const inReview = items.filter((p) => p.publishStatus === "review");

  const PILL: Record<string, string> = { planned: "planned", ongoing: "pending", completed: "approved" };

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Projects</h1>
          <p>Track projects from plan to completion. Drag a card to change its status.</p>
        </div>
        <div className="admin2-actions" style={{ alignItems: "center" }}>
          <div role="group" aria-label="View" style={{ display: "flex", padding: 4, background: "#e9e7e1", borderRadius: 10 }}>
            <Link
              href="/admin/projects"
              aria-pressed={!isTable}
              style={{ height: 36, padding: "0 12px", borderRadius: 7, background: isTable ? "transparent" : "#fff", fontSize: 13, fontWeight: isTable ? 600 : 700, color: isTable ? "#4e5957" : "#15201f", display: "flex", alignItems: "center" }}
            >
              Board
            </Link>
            <Link
              href="/admin/projects?view=table"
              aria-pressed={isTable}
              style={{ height: 36, padding: "0 12px", borderRadius: 7, background: isTable ? "#fff" : "transparent", fontSize: 13, fontWeight: isTable ? 700 : 600, color: isTable ? "#15201f" : "#4e5957", display: "flex", alignItems: "center" }}
            >
              Table
            </Link>
          </div>
          <Link href="/admin/projects/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New project
          </Link>
        </div>
      </div>

      {inReview.length > 0 && (
        <section className="admin2-panel" style={{ marginBottom: 20 }}>
          <div className="admin2-panel-toolbar">
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Waiting for review ({inReview.length})</h2>
            <span style={{ fontSize: 13, color: "#5b6664" }}>Submitted by lecturers. Open one to edit, or publish it as is.</span>
          </div>
          {inReview.map((p) => (
            <div key={String(p._id)} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) auto auto" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</span>
                <span style={{ fontSize: 13, color: "#6b7573" }}>by {owners.get(String(p.owner)) ?? "a lecturer"} · {new Date(p.updatedAt).toLocaleDateString("en-GB")}</span>
              </span>
              <Link href={`/admin/projects/${p._id}`} className="admin2-btn outline" style={{ height: 36, fontSize: 13 }}>
                Review &amp; edit
              </Link>
              <form action={publishProjectAction}>
                <input type="hidden" name="id" value={String(p._id)} />
                <button type="submit" className="admin2-btn" style={{ height: 36, fontSize: 13 }}>
                  Publish
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      {isTable ? (
        <section className="admin2-panel">
          <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 160px" }}>
            <span>TITLE</span>
            <span>STATUS</span>
            <span>UPDATED</span>
            <span></span>
          </div>
          {items.length === 0 && <EmptyState title="No projects yet" message="Projects you add will show up here and on the public site." actionHref="/admin/projects/new" actionLabel="New project" />}
          {items.map((item) => (
            <div key={item._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 160px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {item.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                  <img src={item.images[0]} alt="" className="admin2-thumb" />
                ) : (
                  <div className="admin2-thumb" />
                )}
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
                  {item.publishStatus === "archived" && (
                    <span className="admin2-pill archived" style={{ fontSize: 11, width: "fit-content" }}>
                      <span className="dot" />
                      Archived
                    </span>
                  )}
                  {item.publishStatus === "review" && (
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className="admin2-pill review" style={{ fontSize: 11 }}>
                        <span className="dot" />
                        Awaiting review
                      </span>
                      {item.owner && <span style={{ fontSize: 12.5, color: "#6b7573" }}>by {owners.get(String(item.owner)) ?? "a lecturer"}</span>}
                    </span>
                  )}
                </span>
              </div>
              <span className={`admin2-pill ${PILL[item.status]}`}>
                <span className="dot" />
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
              <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <Link href={`/admin/projects/${item._id}`} aria-label="Edit" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h4L19 9l-4-4L4 16z" />
                  </svg>
                </Link>
                {item.publishStatus !== "review" && (
                  <form action={setProjectArchivedAction} style={{ display: "flex", alignItems: "center" }}>
                    <input type="hidden" name="id" value={item._id} />
                    <input type="hidden" name="archive" value={item.publishStatus === "archived" ? "0" : "1"} />
                    <button type="submit" className="row-action">
                      {item.publishStatus === "archived" ? "Restore" : "Archive"}
                    </button>
                  </form>
                )}
                <form action={deleteProjectAction}>
                  <input type="hidden" name="id" value={item._id} />
                  <ConfirmSubmit title="Delete this project?" message="It will be removed from the admin and the public site." confirmLabel="Delete" ariaLabel="Delete" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                    </svg>
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <ProjectsBoard
          items={items.filter((item) => item.publishStatus !== "archived").map((item) => ({
            _id: item._id,
            title: item.title,
            status: item.status,
            image: item.images?.[0],
          }))}
        />
      )}
    </div>
  );
}
