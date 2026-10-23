"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Current = { category?: string; interest?: string; q?: string };

/** Short tab labels; any category an admin adds later simply uses its own name. */
const SHORT: Record<string, string> = {
  "Director & Vice Director": "Director",
  "Honorary Advisory Board": "Advisory board",
  "Peneliti Alumni": "Alumni",
  "Peneliti Mahasiswa": "Mahasiswa",
};
const shortLabel = (name: string) => SHORT[name] ?? name;

function hrefFor(next: Current) {
  const query = new URLSearchParams();
  if (next.category) query.set("category", next.category);
  if (next.interest) query.set("interest", next.interest);
  if (next.q) query.set("q", next.q);
  const qs = query.toString();
  return qs ? `/team?${qs}` : "/team";
}

/**
 * People page filters: role tabs (mutually exclusive, so tabs rather than pills), a name search, and
 * research interest as a dropdown so a growing list of topics never turns into a wall of chips.
 * Active filters are shown with the result count and can be cleared one by one.
 */
export function TeamFilterBar({ categories, interests, current, total }: { categories: string[]; interests: string[]; current: Current; total: number }) {
  const router = useRouter();
  const [query, setQuery] = useState(current.q ?? "");
  const [focused, setFocused] = useState(false);
  const [seenQ, setSeenQ] = useState(current.q ?? "");

  // The URL can change without typing (removing the search chip, browser back). Mirror it into the box,
  // but never while the visitor is typing - that would overwrite keystrokes made since the last request.
  if ((current.q ?? "") !== seenQ) {
    setSeenQ(current.q ?? "");
    if (!focused) setQuery(current.q ?? "");
  }

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === (current.q ?? "")) return;
    const timer = window.setTimeout(() => router.replace(hrefFor({ ...current, q: trimmed || undefined }), { scroll: false }), 350);
    return () => window.clearTimeout(timer);
  }, [query, current, router]);

  const active = [
    current.category && { key: "category", label: shortLabel(current.category), clear: { ...current, category: undefined } },
    current.interest && { key: "interest", label: current.interest, clear: { ...current, interest: undefined } },
    current.q && { key: "q", label: `"${current.q}"`, clear: { ...current, q: undefined } },
  ].filter(Boolean) as { key: string; label: string; clear: Current }[];

  return (
    <div className="people-filter">
      <nav className="people-tabs" aria-label="Filter by role">
        <Link href={hrefFor({ ...current, category: undefined })} className={`people-tab${!current.category ? " active" : ""}`} scroll={false}>
          All
        </Link>
        {categories.map((cat) => (
          <Link key={cat} href={hrefFor({ ...current, category: cat })} className={`people-tab${current.category === cat ? " active" : ""}`} scroll={false}>
            {shortLabel(cat)}
          </Link>
        ))}
      </nav>

      <div className="people-controls">
        <label className="people-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" placeholder="Cari nama" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} aria-label="Cari nama" />
        </label>
        {interests.length > 0 && (
          <select className="people-select" value={current.interest ?? ""} onChange={(e) => router.push(hrefFor({ ...current, interest: e.target.value || undefined }), { scroll: false })} aria-label="Filter minat riset">
            <option value="">Semua minat riset</option>
            {interests.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
      </div>

      {active.length > 0 && (
        <div className="people-active" aria-live="polite">
          {active.map((a) => (
            <Link key={a.key} href={hrefFor(a.clear)} className="people-active-chip" scroll={false} aria-label={`Hapus filter ${a.label}`}>
              {a.label}
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          <span className="people-count">{total} orang</span>
        </div>
      )}
    </div>
  );
}
