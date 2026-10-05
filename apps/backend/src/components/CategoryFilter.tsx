import Link from "next/link";

/** Filter chips for a public list page: "All" plus every category in use. Selecting one reloads the list with ?category=. */
export function CategoryFilter({ basePath, categories, active }: { basePath: string; categories: string[]; active?: string }) {
  if (categories.length === 0) return null;
  return (
    <div className="team-filters" style={{ marginBottom: 24 }}>
      <Link href={basePath} className={`team-filter${!active ? " active" : ""}`}>
        All
      </Link>
      {categories.map((c) => (
        <Link key={c} href={`${basePath}?category=${encodeURIComponent(c)}`} className={`team-filter${active === c ? " active" : ""}`}>
          {c}
        </Link>
      ))}
    </div>
  );
}
