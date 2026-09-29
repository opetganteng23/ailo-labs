import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { TEAM_CATEGORIES, Team } from "@/models/Team";

import { deleteTeamAction } from "./actions";

export const dynamic = "force-dynamic";

type TeamItem = { _id: string; name: string; position: string; category?: string; photo?: string; profiles?: Record<string, string | undefined> };

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  await connectToDatabase();
  const allItems = (await Team.find().sort({ category: 1, displayOrder: 1, name: 1 }).lean()) as unknown as TeamItem[];
  const items = category ? allItems.filter((i) => i.category === category) : allItems;

  const counts: Record<string, number> = { All: allItems.length };
  for (const cat of TEAM_CATEGORIES) {
    counts[cat] = allItems.filter((i) => i.category === cat).length;
  }

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Team</h1>
          <p>Lecturers, researchers, student researchers, alumni and advisors shown on the public site.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/admin/team/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add member
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        <Link
          href="/admin/team"
          style={{
            height: 38,
            padding: "0 14px",
            borderRadius: 999,
            background: !category ? "#0b454c" : "#fff",
            color: !category ? "#fff" : "#3b4947",
            border: !category ? "0" : "1px solid #dad7cf",
            fontSize: 13,
            fontWeight: !category ? 700 : 600,
            display: "flex",
            alignItems: "center",
          }}
        >
          All {counts.All}
        </Link>
        {TEAM_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/admin/team?category=${encodeURIComponent(cat)}`}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 999,
              background: category === cat ? "#0b454c" : "#fff",
              color: category === cat ? "#fff" : "#3b4947",
              border: category === cat ? "0" : "1px solid #dad7cf",
              fontSize: 13,
              fontWeight: category === cat ? 700 : 600,
              display: "flex",
              alignItems: "center",
            }}
          >
            {cat} {counts[cat]}
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {items.map((item) => {
          const links = Object.entries(item.profiles ?? {}).filter(([, v]) => v);
          return (
            <article key={item._id} style={{ background: "#fff", border: "1px solid #e3e1da", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                  <img src={item.photo} alt="" style={{ width: 64, height: 64, borderRadius: 999, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 999, background: "#dde7e6", color: "#56706e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
                    {item.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{item.name}</span>
                  <span style={{ fontSize: 13, color: "#5b6664" }}>{item.position}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {item.category && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0b454c", background: "#e3f1f1", borderRadius: 999, padding: "4px 10px" }}>{item.category}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#6b7573" }}>{links.length === 0 ? "No profile links yet" : `${links.length} profile link${links.length === 1 ? "" : "s"}`}</div>
              <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #eeece6" }}>
                <Link href={`/admin/team/${item._id}`} className="admin2-btn outline" style={{ height: 38, fontSize: 13 }}>
                  Edit
                </Link>
                <form action={deleteTeamAction} style={{ marginLeft: "auto" }}>
                  <input type="hidden" name="id" value={item._id} />
                  <button type="submit" aria-label="Delete member" className="admin2-btn ghost" style={{ padding: 0, width: 38, height: 38, justifyContent: "center", color: "#9d1b1b" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                    </svg>
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
