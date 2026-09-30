import Link from "next/link";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

import { ReviewPill } from "../ReviewPill";

export const dynamic = "force-dynamic";

type Item = { _id: string; title: string; summary?: string; category: string; status: "draft" | "review" | "published"; updatedAt: string; reviewNote?: string };

export default async function DosenNewsPage() {
  const session = (await getSession())!;
  await connectToDatabase();
  const items = (await News.find({ author: session.sub }).sort({ updatedAt: -1 }).lean()) as unknown as Item[];
  const cols = "minmax(0, 1fr) 150px 130px 130px 80px";

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>News drafts</h1>
          <p>Write a news draft (use the 5W+1H helper if you like). The AILO admins review, edit and publish it.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/dosen/news/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New draft
          </Link>
        </div>
      </div>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: cols }}>
          <span>ARTICLE</span>
          <span>CATEGORY</span>
          <span>STATUS</span>
          <span>UPDATED</span>
          <span></span>
        </div>
        {items.length === 0 && <p className="admin2-table-empty">No drafts yet.</p>}
        {items.map((item) => (
          <div key={String(item._id)} className="admin2-table-row" style={{ gridTemplateColumns: cols }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
              <span style={{ fontSize: 13, color: "#6b7573" }}>{item.summary}</span>
              {item.reviewNote && <span style={{ fontSize: 12.5, color: "#7a4a12" }}>Admin note: {item.reviewNote}</span>}
            </div>
            <span style={{ fontSize: 14 }}>{item.category}</span>
            <ReviewPill state={item.status} />
            <span style={{ fontSize: 14, color: "#5b6664" }}>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
            {item.status === "published" ? (
              <span style={{ fontSize: 12.5, color: "#6b7573" }}>Locked</span>
            ) : (
              <Link href={`/dosen/news/${item._id}`} className="admin2-btn outline" style={{ height: 36, padding: "0 12px", fontSize: 13 }}>
                Edit
              </Link>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
