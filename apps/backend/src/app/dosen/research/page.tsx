import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

import { deleteDosenResearchAction } from "../actions";
import { ReviewPill } from "../ReviewPill";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type Item = { _id: string; title: string; description: string; content: string; image?: string; status: "draft" | "review" | "published"; updatedAt: string; reviewNote?: string };

export default async function DosenResearchPage() {
  const session = (await getSession())!;
  await connectToDatabase();
  const items = (await Research.find({ owner: session.sub }).sort({ updatedAt: -1 }).lean()) as unknown as Item[];
  const cols = "minmax(0, 1fr) 130px 130px 96px";

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>My research</h1>
          <p>Your research topics. New items and edits go to an admin for review before they appear on the site.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/dosen/research/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New research
          </Link>
        </div>
      </div>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: cols }}>
          <span>TITLE</span>
          <span>STATUS</span>
          <span>UPDATED</span>
          <span></span>
        </div>
        {items.length === 0 && <EmptyState title="No research yet" message="Add a research topic and it goes to the admins for review." actionHref="/dosen/research/new" actionLabel="Add research" />}
        {items.map((item) => (
          <div key={String(item._id)} className="admin2-table-row" style={{ gridTemplateColumns: cols }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
              <span style={{ fontSize: 13, color: "#6b7573" }}>{item.description}</span>
              {item.reviewNote && <span style={{ fontSize: 12.5, color: "#7a4a12" }}>Admin note: {item.reviewNote}</span>}
            </div>
            <ReviewPill state={item.status} />
            <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
            {item.status === "published" ? (
              <span style={{ fontSize: 12.5, color: "#6b7573" }}>Locked</span>
            ) : (
              <div style={{ display: "flex", gap: 4 }}>
                <Link href={`/dosen/research/${item._id}`} aria-label="Edit" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h4L19 9l-4-4L4 16z" />
                  </svg>
                </Link>
                <form action={deleteDosenResearchAction}>
                  <input type="hidden" name="id" value={String(item._id)} />
                  <ConfirmSubmit title="Delete this research?" message="It hasn't been published, so it will just be removed." ariaLabel="Delete" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                    </svg>
                  </ConfirmSubmit>
                </form>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
