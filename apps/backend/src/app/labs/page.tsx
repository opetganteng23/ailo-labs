import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

type LabItem = { _id: string; name: string; slug: string; location?: string; capacity?: number; facilities?: string; photos?: string[] };

export default async function LabsListPage() {
  await connectToDatabase();
  const items = (await Lab.find({ isActive: true }).sort({ name: 1 }).lean()) as unknown as LabItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">LABS &amp; EQUIPMENT</span>
            <h1>Labs &amp; equipment</h1>
          </div>
          <div className="sec-desc">
            <p>Every AILO lab and its equipment, with live availability. Submit a request and get a confirmation by email.</p>
          </div>
        </div>

        {items.length === 0 && <p className="notice">No labs published yet.</p>}

        <div className="lab2-grid">
          {items.map((item) => (
            <Link key={item._id} href={`/labs/${item.slug}`} className="lab2-card">
              <div className="lab2-thumb" style={item.photos?.[0] ? { backgroundImage: `url(${item.photos[0]})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {item.location && <span className="badge">{item.location}</span>}
              </div>
              <div className="lab2-body">
                <h3>{item.name}</h3>
                {item.facilities && <p>{item.facilities}</p>}
                {item.capacity !== undefined && (
                  <div className="chips">
                    <span>Capacity {item.capacity}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
