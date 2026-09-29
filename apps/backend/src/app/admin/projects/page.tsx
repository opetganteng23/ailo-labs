import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { deleteProjectAction } from "./actions";
import { ProjectsBoard } from "./ProjectsBoard";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const isTable = view === "table";

  await connectToDatabase();
  const items = (await Project.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    title: string;
    status: "planned" | "ongoing" | "completed";
    images?: string[];
    updatedAt: string;
  }[];

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

      {isTable ? (
        <section className="admin2-panel">
          <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 96px" }}>
            <span>TITLE</span>
            <span>STATUS</span>
            <span>UPDATED</span>
            <span></span>
          </div>
          {items.length === 0 && <p className="admin2-table-empty">No projects yet.</p>}
          {items.map((item) => (
            <div key={item._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 140px 150px 96px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {item.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                  <img src={item.images[0]} alt="" className="admin2-thumb" />
                ) : (
                  <div className="admin2-thumb" />
                )}
                <span style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
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
                <form action={deleteProjectAction}>
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
        </section>
      ) : (
        <ProjectsBoard
          items={items.map((item) => ({
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
