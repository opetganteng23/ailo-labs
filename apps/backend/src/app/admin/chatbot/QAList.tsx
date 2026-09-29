"use client";

import { useState } from "react";

import { createQAAction, deleteQAAction } from "./actions";

type QA = { _id: string; question: string; answer: string };

export function QAList({ items }: { items: QA[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
          <h2>Custom Q&amp;A</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
            Exact answers for common questions. These always win over retrieved content.
          </p>
        </div>
        {!adding && (
          <button type="button" className="admin2-btn teal-outline" onClick={() => setAdding(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Q&amp;A
          </button>
        )}
      </div>

      {adding && (
        <form
          action={async (formData) => {
            await createQAAction(formData);
            setAdding(false);
          }}
          style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, border: "1px solid #dad7cf", borderRadius: 12, background: "#fbfaf7" }}
        >
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#5b6664" }} htmlFor="qa-question">
            QUESTION
          </label>
          <input id="qa-question" name="question" type="text" required placeholder="mis. Bagaimana cara meminjam lab?" style={{ background: "#fff" }} />
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#5b6664" }} htmlFor="qa-answer">
            ANSWER
          </label>
          <textarea id="qa-answer" name="answer" required rows={3} placeholder="Jawaban yang akan dipakai chatbot…" style={{ background: "#fff" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="admin2-btn ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" className="admin2-btn">
              Save Q&amp;A
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !adding && <p style={{ fontSize: 14, color: "#6b7573" }}>No custom Q&amp;A yet.</p>}

      {items.map((qa) => (
        <div key={qa._id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 16, border: "1px solid #eeece6", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flexGrow: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#15201f" }}>{qa.question}</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "#4e5957" }}>{qa.answer}</p>
            </div>
            <form action={deleteQAAction}>
              <input type="hidden" name="id" value={qa._id} />
              <button type="submit" aria-label="Delete Q&A" className="admin2-btn ghost" style={{ padding: 0, width: 32, height: 32, justifyContent: "center", color: "#9d1b1b" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
