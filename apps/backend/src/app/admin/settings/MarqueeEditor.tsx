"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";

type MarqueeItem = { bold: string; text: string; image: string };

const DEFAULT_ITEMS: MarqueeItem[] = [
  { bold: "Optimization", text: "Reinforcement Learning", image: "" },
  { bold: "NLP", text: "Retrieval-Augmented Generation", image: "" },
  { bold: "Computer Vision", text: "Edge Deployment", image: "" },
  { bold: "Applied ML", text: "Smart Campus Systems", image: "" },
];

/**
 * Editor for the scrolling strip under the homepage hero. Each item is either
 * a bold label + text, or an uploaded image (e.g. a partner logo) - whichever
 * the admin fills in. Submits as three same-length, same-name hidden input
 * arrays (marqueeBold/marqueeText/marqueeImage) so the server action can zip
 * them back into items with formData.getAll(), the same pattern the hero's
 * multi-image fields already use.
 */
export function MarqueeEditor({ items }: { items?: { bold?: string; text?: string; image?: string }[] }) {
  const initial: MarqueeItem[] = items && items.length > 0 ? items.map((i) => ({ bold: i.bold ?? "", text: i.text ?? "", image: i.image ?? "" })) : DEFAULT_ITEMS;
  const [rows, setRows] = useState<MarqueeItem[]>(initial);

  function updateRow(index: number, patch: Partial<MarqueeItem>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function addRow() {
    setRows((prev) => [...prev, { bold: "", text: "", image: "" }]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rows.map((row, i) => (
        <div key={i} className="admin2-section" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="marqueeBold" value={row.bold} />
          <input type="hidden" name="marqueeText" value={row.text} />
          <input type="hidden" name="marqueeImage" value={row.image} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7573" }}>Item {i + 1}</span>
            <button type="button" onClick={() => removeRow(i)} style={{ fontSize: 13, color: "#b43a3a", background: "none", border: "none", cursor: "pointer" }}>
              Remove
            </button>
          </div>
          {!row.image && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12 }}>
              <div className="admin2-field">
                <label>Bold label</label>
                <input type="text" value={row.bold} placeholder="e.g. Optimization" onChange={(e) => updateRow(i, { bold: e.target.value })} />
              </div>
              <div className="admin2-field">
                <label>Text</label>
                <input type="text" value={row.text} placeholder="e.g. Reinforcement Learning" onChange={(e) => updateRow(i, { text: e.target.value })} />
              </div>
            </div>
          )}
          <ImageUploadField
            name={`marqueeImageUpload_${i}`}
            label={row.image ? "Image (replaces the text above)" : "Or use an image instead of text"}
            defaultValue={row.image}
            hint="Small logo or icon - renders at the strip's height"
            onChangeUrl={(url) => updateRow(i, { image: url })}
          />
        </div>
      ))}
      <button type="button" onClick={addRow} className="admin2-btn outline" style={{ alignSelf: "flex-start" }}>
        + Add item
      </button>
    </div>
  );
}
