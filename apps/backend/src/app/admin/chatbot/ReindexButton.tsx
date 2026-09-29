"use client";

import { useState } from "react";

export function ReindexButton() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/chatbot/reindex", { method: "POST" });
      const json = await res.json();
      setStatus(json.success ? `Indexed ${json.data.chunksIndexed} chunks.` : json.error ?? "Failed.");
    } catch {
      setStatus("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button type="button" className="admin2-btn" onClick={handleClick} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />
        </svg>
        {loading ? "Re-indexing…" : "Re-index now"}
      </button>
      {status && <span style={{ fontSize: 12, color: "#5b6664" }}>{status}</span>}
    </div>
  );
}
