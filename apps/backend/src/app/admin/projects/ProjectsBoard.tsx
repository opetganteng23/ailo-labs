"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { moveProjectStatusAction } from "./actions";

type ProjectCard = { _id: string; title: string; status: "planned" | "ongoing" | "completed"; image?: string };

const COLUMNS: { key: ProjectCard["status"]; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
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
    <div style={{ display: "flex", gap: 20, marginTop: 24, alignItems: "flex-start" }}>
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
          style={{
            flex: "1 1 0",
            minWidth: 260,
            background: "var(--paper-dim)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: 12,
            minHeight: 200,
          }}
        >
          <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em", color: "#5b6469", marginBottom: 12 }}>
            {col.label} ({cards.filter((c) => c.status === col.key).length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cards
              .filter((c) => c.status === col.key)
              .map((c) => (
                <div
                  key={c._id}
                  draggable
                  onDragStart={() => setDragId(c._id)}
                  className="card"
                  style={{ cursor: "grab", padding: 0 }}
                >
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                    <img
                      src={c.image}
                      alt={c.title}
                      style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block", borderRadius: "4px 4px 0 0" }}
                    />
                  ) : (
                    <div
                      style={{ width: "100%", aspectRatio: "16/10", background: "var(--line)", borderRadius: "4px 4px 0 0" }}
                    />
                  )}
                  <div style={{ padding: 12 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{c.title}</p>
                    <Link href={`/admin/projects/${c._id}`} className="btn outline" style={{ fontSize: 12, padding: "6px 10px" }}>
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
