import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

type LabItem = { _id: string; name: string; slug: string; location?: string; description?: string };

export default async function LabsListPage() {
  await connectToDatabase();
  const items = (await Lab.find({ isActive: true }).sort({ name: 1 }).lean()) as unknown as LabItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>Labs &amp; Equipment</h1>
        <p>Reserve a lab or device - submit a request and get an email confirmation.</p>
        {items.length === 0 && <p className="notice">No labs published yet.</p>}
        <div className="grid cols-3" style={{ marginTop: 24 }}>
          {items.map((item) => (
            <Link key={item._id} href={`/labs/${item.slug}`} className="card">
              <h3>{item.name}</h3>
              {item.location && <p style={{ fontSize: 13, color: "#5b6469" }}>{item.location}</p>}
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
