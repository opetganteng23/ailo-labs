import Link from "next/link";

/** List / Board switch, styled like the Projects Board / Table switch. */
export function ListViewToggle({ basePath, params, view }: { basePath: string; params: Record<string, string | undefined>; view: "list" | "board" }) {
  const href = (next: "list" | "board") => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, view: next === "board" ? "board" : undefined })) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const style = (active: boolean) => ({
    height: 36,
    padding: "0 12px",
    borderRadius: 7,
    background: active ? "#fff" : "transparent",
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    color: active ? "#15201f" : "#4e5957",
    display: "flex",
    alignItems: "center",
  });
  return (
    <div role="group" aria-label="View" style={{ display: "flex", padding: 4, background: "#e9e7e1", borderRadius: 10 }}>
      <Link href={href("list")} aria-pressed={view === "list"} style={style(view === "list")}>
        List
      </Link>
      <Link href={href("board")} aria-pressed={view === "board"} style={style(view === "board")}>
        Board
      </Link>
    </div>
  );
}
