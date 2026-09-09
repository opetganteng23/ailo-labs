import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

export const dynamic = "force-dynamic";

type ProjectItem = { _id: string; title: string; slug: string; description: string; status: string; images?: string[] };

export default async function ProjectsListPage() {
  await connectToDatabase();
  const items = (await Project.find().sort({ createdAt: -1 }).lean()) as unknown as ProjectItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <h1>Projects</h1>
        <p>Applied builds carrying AILO&apos;s research into deployable systems.</p>
        {items.length === 0 && <p className="notice">No projects yet.</p>}
        <div className="grid cols-3" style={{ marginTop: 24 }}>
          {items.map((item) => (
            <Link key={item._id} href={`/projects/${item.slug}`} className="card">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
              {item.images?.[0] && <img className="card-thumb" src={item.images[0]} alt={item.title} />}
              <span className="badge">{item.status}</span>
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
