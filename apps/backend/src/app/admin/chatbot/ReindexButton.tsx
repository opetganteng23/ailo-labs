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
    <div>
      <button className="btn" onClick={handleClick} disabled={loading}>
        {loading ? "Re-indexing..." : "Re-index Now"}
      </button>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
