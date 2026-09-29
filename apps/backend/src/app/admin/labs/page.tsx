import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

type LabItem = {
  _id: string;
  name: string;
  location?: string;
  capacity?: number;
  photos?: string[];
  devices?: string[];
};

export default async function AdminLabsPage() {
  await connectToDatabase();
  const items = (await Lab.find().sort({ name: 1 }).lean()) as unknown as LabItem[];

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Labs</h1>
          <p>Rooms visitors can book, and the devices inside them.</p>
        </div>
        <div className="admin2-actions">
          <Link href="/admin/labs/devices" className="admin2-btn outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="12" rx="2" />
              <path d="M8 20h8" />
            </svg>
            All devices
          </Link>
          <Link href="/admin/labs/new" className="admin2-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add lab
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {items.map((lab) => (
          <article key={lab._id} style={{ background: "#fff", border: "1px solid #e3e1da", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 180, background: "#dde7e6", position: "relative" }}>
              {lab.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                <img src={lab.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {lab.location && (
                <span style={{ position: "absolute", top: 12, left: 12, fontSize: 12, fontWeight: 700, color: "#0b454c", background: "#fff", borderRadius: 999, padding: "4px 10px" }}>
                  {lab.location}
                </span>
              )}
            </div>
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, flexGrow: 1 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>{lab.name}</h2>
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3b4947", background: "#f1efea", borderRadius: 8, padding: "6px 10px" }}>
                  Capacity {lab.capacity ?? "—"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3b4947", background: "#f1efea", borderRadius: 8, padding: "6px 10px" }}>
                  {lab.devices?.length ?? 0} devices
                </span>
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #eeece6", display: "flex", gap: 8 }}>
              <Link href={`/admin/labs/${lab._id}`} className="admin2-btn outline" style={{ height: 40, fontSize: 13 }}>
                Edit details
              </Link>
              <Link href={`/admin/labs/${lab._id}`} className="admin2-btn" style={{ height: 40, fontSize: 13, background: "#e3f1f1", color: "#0b454c" }}>
                Manage devices
              </Link>
            </div>
          </article>
        ))}

        <Link
          href="/admin/labs/new"
          style={{ border: "1.5px dashed #bfc9c7", borderRadius: 16, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#3b4947", minHeight: 300 }}
        >
          <span style={{ width: 48, height: 48, borderRadius: 999, background: "#e3f1f1", color: "#0e6b73", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Add a lab</span>
          <span style={{ fontSize: 13, color: "#6b7573" }}>Name, location, capacity, facilities, photo</span>
        </Link>
      </div>
    </div>
  );
}
