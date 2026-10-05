import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { EmptyState } from "@/components/EmptyState";
import { connectToDatabase } from "@/lib/mongodb";
import { KnowledgeDoc } from "@/models/KnowledgeDoc";

import { ChatbotTabs } from "../ChatbotTabs";
import { ReindexButton } from "../ReindexButton";
import { deleteKnowledgeDocAction } from "./actions";

export const dynamic = "force-dynamic";

type Row = { _id: string; title: string; source: string; status: string; content: string };

export default async function AdminKnowledgeDocsPage() {
  await connectToDatabase();
  const docs = (await KnowledgeDoc.find().sort({ source: 1, createdAt: 1 }).select("title source status content").lean()) as unknown as Row[];
  const bySource = new Map<string, Row[]>();
  for (const d of docs) bySource.set(d.source, [...(bySource.get(d.source) ?? []), d]);

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Chatbot</h1>
          <p>Reference documents the chatbot can answer from, in addition to the site content.</p>
        </div>
        <div className="admin2-actions">
          <ReindexButton />
          <Link href="/admin/chatbot/documents/new" className="admin2-btn">
            Add document
          </Link>
        </div>
      </div>
      <ChatbotTabs active="documents" apiKeyMissing={false} />

      {docs.length === 0 && <EmptyState title="No documents yet" message="Add a document with facts the chatbot should know, then run Reindex." actionHref="/admin/chatbot/documents/new" actionLabel="Add document" />}

      {Array.from(bySource.entries()).map(([source, rows]) => (
        <section key={source} className="admin2-panel" style={{ marginBottom: 20 }}>
          <div className="admin2-panel-toolbar">
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{source}</h2>
            <span style={{ fontSize: 13, color: "#5b6664" }}>
              {rows.length} document{rows.length === 1 ? "" : "s"}
            </span>
          </div>
          {rows.map((d) => (
            <div key={String(d._id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderTop: "1px solid #ece9e1", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <Link href={`/admin/chatbot/documents/${d._id}`} style={{ fontWeight: 700, fontSize: 15, overflowWrap: "anywhere" }}>
                  {d.title}
                </Link>
                <div style={{ fontSize: 12.5, color: "#6b7573" }}>{d.content.length.toLocaleString("en-US")} characters</div>
              </div>
              <span className={`admin2-pill ${d.status === "draft" ? "draft" : "published"}`}>
                <span className="dot" />
                {d.status === "draft" ? "Draft" : "Published"}
              </span>
              <Link href={`/admin/chatbot/documents/${d._id}`} className="admin2-btn outline" style={{ height: 38, fontSize: 13 }}>
                Edit
              </Link>
              <form action={deleteKnowledgeDocAction}>
                <input type="hidden" name="id" value={String(d._id)} />
                <ConfirmSubmit
                  title="Delete this document?"
                  message="The chatbot stops using it after the next Reindex."
                  confirmLabel="Delete"
                  ariaLabel="Delete document"
                  className="admin2-btn ghost"
                  style={{ padding: 0, width: 38, height: 38, justifyContent: "center", color: "#9d1b1b" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                  </svg>
                </ConfirmSubmit>
              </form>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
