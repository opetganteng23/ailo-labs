import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

type TeamItem = { _id: string; name: string; slug: string; position: string; scopusData?: { hIndex?: number } };

export default async function TeamListPage() {
  await connectToDatabase();
  const items = (await Team.find({ isActive: true }).sort({ name: 1 }).lean()) as unknown as TeamItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>Team</h1>
        <p>Faculty, researchers, and students across AILO&apos;s research tracks.</p>
        {items.length === 0 && <p className="notice">No team members yet.</p>}
        <div className="grid cols-4" style={{ marginTop: 24 }}>
          {items.map((item) => (
            <Link key={item._id} href={`/team/${item.slug}`} className="card">
              <h3>{item.name}</h3>
              <p>{item.position}</p>
              {item.scopusData?.hIndex !== undefined && <p style={{ fontSize: 12 }}>h-index {item.scopusData.hIndex}</p>}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
