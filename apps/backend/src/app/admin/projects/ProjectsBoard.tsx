"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { moveProjectStatusAction } from "./actions";

type ProjectCard = { _id: string; title: string; status: "planned" | "ongoing" | "completed"; image?: string };

const COLUMNS: { key: ProjectCard["status"]; label: string; dot: string; pillBg: string; pillColor: string }[] = [
  { key: "planned", label: "Planned", dot: "#3F6FB5", pillBg: "#E1ECFA", pillColor: "#1F4E8C" },
  { key: "ongoing", label: "Ongoing", dot: "#D9731F", pillBg: "#FDEBD7", pillColor: "#7A4A12" },
  { key: "completed", label: "Completed", dot: "#2E8A5A", pillBg: "#DCF1E4", pillColor: "#17603A" },
];

export function ProjectsBoard({ items }: { items: ProjectCard[] }) {
  const [cards, setCards] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(status: ProjectCard["status"]) {
    if (!dragId) return;
    const id = dragId;
    setDragId(null);
    setCards((prev) => prev.map((c) => (c._id === id ? { ...c, status } : c)));
    startTransition(() => {
      moveProjectStatusAction(id, status);
    });
  }

  return (
    <div className="admin2-projects-board">
      {COLUMNS.map((col) => {
        const colCards = cards.filter((c) => c.status === col.key);
        return (
          <section
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            style={{ background: "#ECEAE4", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px" }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: col.dot }} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{col.label}</h2>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5b6664" }}>{colCards.length}</span>
              <Link href={`/admin/projects/new?status=${col.key}`} aria-label={`Add ${col.label.toLowerCase()} project`} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 8, background: "transparent", color: "#3b4947", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                +
              </Link>
            </div>

            {colCards.length === 0 ? (
              <div style={{ height: 120, border: "1.5px dashed #c9c6bd", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#6b7573", textAlign: "center", padding: "0 24px" }}>
                No {col.label.toLowerCase()} projects yet. Drop a card here.
              </div>
            ) : (
              colCards.map((c) => (
                <article
                  key={c._id}
                  draggable
                  onDragStart={() => setDragId(c._id)}
                  style={{ background: "#fff", border: "1px solid #e3e1da", borderRadius: 12, overflow: "hidden", cursor: "grab" }}
                >
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                    <img src={c.image} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ height: 120, background: "#dde5f0" }} />
                  )}
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{c.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: col.pillColor, background: col.pillBg, borderRadius: 999, padding: "4px 10px" }}>
                        {col.label}
                      </span>
                      <Link href={`/admin/projects/${c._id}`} className="admin2-btn outline" style={{ marginLeft: "auto", height: 32, padding: "0 10px", fontSize: 13 }}>
                        Edit
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
