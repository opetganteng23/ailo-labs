"use client";

import { useState } from "react";

type Message = { role: "user" | "bot"; text: string };

export function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      setMessages((m) => [...m, { role: "bot", text: json.data?.answer ?? "Unable to answer right now." }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Network error." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin2-panel" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", borderBottom: "1px solid #eeece6" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Try it</h2>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#6b7573" }}>Live preview</span>
      </div>
      <div className="admin2-chat-preview">
        {messages.length === 0 && (
          <div className="admin2-chat-bubble">Ask a question to see how the assistant answers right now, using indexed content and custom Q&amp;A.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`admin2-chat-bubble${m.role === "user" ? " user" : ""}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ padding: 12, display: "flex", gap: 8, borderTop: "1px solid #eeece6" }}>
        <label htmlFor="tryq" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
          Test question
        </label>
        <input
          id="tryq"
          type="text"
          placeholder="Ask a test question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flexGrow: 1, height: 44 }}
        />
        <button
          aria-label="Send"
          onClick={send}
          disabled={loading}
          style={{ width: 44, height: 44, borderRadius: 10, border: 0, background: "#0e6b73", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
