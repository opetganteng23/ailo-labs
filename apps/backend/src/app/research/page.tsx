import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

export const dynamic = "force-dynamic";

type ResearchItem = { _id: string; title: string; slug: string; description: string; image?: string };

export default async function ResearchListPage() {
  await connectToDatabase();
  const items = (await Research.find({ status: "published" }).sort({ createdAt: -1 }).lean()) as unknown as ResearchItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>Research Areas</h1>
        <p>Applied research tracks pursued by AILO.</p>
        {items.length === 0 && <p className="notice">No published research yet.</p>}
        <div className="grid cols-3" style={{ marginTop: 24 }}>
          {items.map((item) => (
            <Link key={item._id} href={`/research/${item.slug}`} className="card">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
              {item.image && <img className="card-thumb" src={item.image} alt={item.title} />}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
