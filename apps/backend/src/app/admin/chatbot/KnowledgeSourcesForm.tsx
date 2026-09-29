"use client";

import { useRef } from "react";

import { saveKnowledgeSourcesAction } from "./actions";

const SOURCES = [
  {
    key: "news",
    label: "News",
    icon: "M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3",
  },
  {
    key: "research",
    label: "Research",
    icon: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3",
  },
  {
    key: "project",
    label: "Projects",
    icon: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  {
    key: "team",
    label: "Team",
    icon: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6",
  },
  {
    key: "lab",
    label: "Labs & devices",
    icon: "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 20h8M12 16v4",
  },
] as const;

export function KnowledgeSourcesForm({
  enabled,
  counts,
}: {
  enabled: string[];
  counts: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={saveKnowledgeSourcesAction}>
      {/* Grid of cards so every content type fits on one screen (QA LAIN-02). */}
      <div className="admin2-source-grid">
        {SOURCES.map((s) => {
          const on = enabled.includes(s.key);
          return (
            <label key={s.key} className="admin2-source-card">
              <span className="admin2-source-card-top">
                <span className="admin2-source-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </span>
                <input
                  className="switch"
                  type="checkbox"
                  name="source"
                  value={s.key}
                  defaultChecked={on}
                  aria-label={`Include ${s.label}`}
                  onChange={() => formRef.current?.requestSubmit()}
                />
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{s.label}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: "#6b7573" }}>{counts[s.key]}</span>
            </label>
          );
        })}
      </div>
    </form>
  );
}
