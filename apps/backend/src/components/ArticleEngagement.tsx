"use client";

import { useEffect, useState } from "react";

export type EngagementKind = "news" | "research" | "project";

const REACTIONS: { key: "keren" | "inspiratif" | "wow" | "belajarBaru"; emoji: string; label: string }[] = [
  { key: "keren", emoji: "\u{1F44F}", label: "Keren" },
  { key: "inspiratif", emoji: "\u{1F525}", label: "Inspiratif" },
  { key: "wow", emoji: "\u{1F62E}", label: "Wow" },
  { key: "belajarBaru", emoji: "\u{1F4A1}", label: "Belajar baru" },
];

type Counts = Partial<Record<(typeof REACTIONS)[number]["key"], number>>;

/**
 * Reaction + share bar shown at the end of News/Research/Project detail pages.
 * One reaction per visitor per article, remembered in localStorage (there's no
 * visitor login on this site, so that's the only practical way to stop repeat
 * clicks - not bulletproof against someone clearing storage or using another
 * browser, but enough to keep the counts honest for normal readers).
 */
export function ArticleEngagement({ kind, slug, title, initialCounts }: { kind: EngagementKind; slug: string; title: string; initialCounts: Counts }) {
  const storageKey = `engagement:${kind}:${slug}`;
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [reacted, setReacted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    try {
      setReacted(window.localStorage.getItem(storageKey));
    } catch {
      // Private browsing or storage disabled - reactions still work, just not remembered across visits.
    }
    setShareUrl(window.location.href);
  }, [storageKey]);

  async function react(key: (typeof REACTIONS)[number]["key"]) {
    if (reacted) return;
    setReacted(key);
    setCounts((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 }));
    try {
      window.localStorage.setItem(storageKey, key);
    } catch {
      // Ignore - the click still counts server-side even if we can't remember it locally.
    }
    try {
      const res = await fetch("/api/engagement/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, slug, reaction: key }),
      });
      const json = await res.json();
      if (json?.success) setCounts(json.data.reactions);
    } catch {
      // Keep the optimistic local count; a refresh will resync from the server.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable - nothing more we can do without a fallback text field.
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 16,
          background: "var(--paper-dim)",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Gimana menurut kamu?</span>
        {REACTIONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => react(r.key)}
            disabled={!!reacted}
            aria-pressed={reacted === r.key}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: reacted === r.key ? "#fff" : "var(--teal-dark)",
              background: reacted === r.key ? "var(--teal)" : "#fff",
              border: "1px solid " + (reacted === r.key ? "var(--teal)" : "var(--line)"),
              borderRadius: 999,
              padding: "6px 12px",
              cursor: reacted ? "default" : "pointer",
              opacity: reacted && reacted !== r.key ? 0.6 : 1,
            }}
          >
            <span aria-hidden="true">{r.emoji}</span>
            {r.label} {counts[r.key] ?? 0}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn outline"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          Bagikan ke WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn outline"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          X
        </a>
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn outline"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          Telegram
        </a>
        {/* Instagram has no web share-intent for arbitrary links; this just copies
            the link so it can be pasted into a story or bio, same as most sites do. */}
        <button type="button" onClick={copyLink} className="btn outline" style={{ padding: "8px 14px", fontSize: 13 }}>
          Instagram
        </button>
        <button type="button" onClick={copyLink} className="btn outline" style={{ padding: "8px 14px", fontSize: 13 }}>
          {copied ? "Tautan tersalin!" : "Salin tautan"}
        </button>
      </div>
    </div>
  );
}
