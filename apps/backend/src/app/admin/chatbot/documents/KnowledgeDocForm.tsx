import Link from "next/link";

import { createKnowledgeDocAction, updateKnowledgeDocAction } from "./actions";

type Initial = { _id: string; title: string; source: string; content: string; status: string };

/** Plain-text document the chatbot can answer from. Paragraphs are separated by a blank line. */
export function KnowledgeDocForm({ initial, sources }: { initial?: Initial; sources: string[] }) {
  return (
    <form action={initial ? updateKnowledgeDocAction : createKnowledgeDocAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {initial && <input type="hidden" name="id" value={initial._id} />}
      <section className="admin2-section" style={{ maxWidth: 860 }}>
        <div className="admin2-field">
          <label htmlFor="title">
            Title<span className="req">*</span>
          </label>
          <input id="title" name="title" required maxLength={200} defaultValue={initial?.title ?? ""} placeholder="e.g. Pimpinan, sejarah, dan kontak AILO" />
        </div>
        <div className="admin2-field">
          <label htmlFor="source">
            Source<span className="req">*</span>
          </label>
          <input id="source" name="source" required maxLength={200} list="knowledge-sources" defaultValue={initial?.source ?? ""} placeholder="e.g. FAQ AILO" />
          <datalist id="knowledge-sources">
            {sources.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <span style={{ fontSize: 12.5, color: "#6b7573" }}>Groups related documents, such as the book or file they came from.</span>
        </div>
        <div className="admin2-field">
          <label htmlFor="content">
            Text<span className="req">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={16}
            defaultValue={initial?.content ?? ""}
            style={{ minHeight: 280 }}
            placeholder={"Write the facts the chatbot should know.\n\nSeparate paragraphs with a blank line. Starting a paragraph with the question it answers helps the chatbot find it."}
          />
        </div>
        <div className="admin2-field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial?.status ?? "published"}>
            <option value="published">Published (chatbot uses it)</option>
            <option value="draft">Draft (ignored)</option>
          </select>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7573" }}>
          Anything here can be repeated to any visitor who asks the chatbot. Do not add budgets, personal data or other internal information.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="admin2-btn">
            {initial ? "Save changes" : "Add document"}
          </button>
          <Link href="/admin/chatbot/documents" className="admin2-btn outline">
            Cancel
          </Link>
        </div>
      </section>
    </form>
  );
}
