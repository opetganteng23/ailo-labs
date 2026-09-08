import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Team.findOne({ slug, isActive: true }).lean<{
    name: string;
    position: string;
    bio?: string;
    email?: string;
    scopusData?: { hIndex?: number; citationCount?: number; documentCount?: number };
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>{item.name}</h1>
        <p style={{ color: "#5b6469" }}>{item.position}</p>
        {item.bio && <p style={{ marginTop: 16 }}>{item.bio}</p>}
        {item.email && <p>Email: {item.email}</p>}
        <div className="card" style={{ marginTop: 24, maxWidth: 420 }}>
          <h3>Scopus metrics</h3>
          <p style={{ fontSize: 13, color: "#5b6469" }}>
            Placeholder fields - no live Scopus API call is made yet.
          </p>
          <p>h-index: {item.scopusData?.hIndex ?? "-"}</p>
          <p>Citations: {item.scopusData?.citationCount ?? "-"}</p>
          <p>Documents: {item.scopusData?.documentCount ?? "-"}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
