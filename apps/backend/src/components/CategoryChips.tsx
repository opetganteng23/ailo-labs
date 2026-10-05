/** The categories of an item, shown as small chips (detail pages). */
export function CategoryChips({ categories, style }: { categories: string[]; style?: React.CSSProperties }) {
  if (categories.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", ...style }}>
      {categories.map((c) => (
        <span key={c} style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "var(--teal-dark)", background: "var(--paper-dim)", borderRadius: 999, padding: "5px 12px" }}>
          {c}
        </span>
      ))}
    </div>
  );
}
