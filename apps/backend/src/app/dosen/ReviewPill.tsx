/** Status label shared by the lecturer lists. */
export function ReviewPill({ state }: { state: "review" | "published" | "draft" }) {
  const label = state === "review" ? "In review" : state === "published" ? "Published" : "Draft";
  return (
    <span className={`admin2-pill ${state}`}>
      <span className="dot" />
      {label}
    </span>
  );
}
