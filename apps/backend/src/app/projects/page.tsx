import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type ProjectItem = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  status: "planned" | "ongoing" | "completed";
  images?: string[];
  publishedAt?: string;
  createdAt?: string;
};

const STATUS_LABEL: Record<string, string> = { planned: "Planned", ongoing: "Ongoing", completed: "Completed" };
const STATUS_CLASS: Record<string, string> = { planned: "status-planned", ongoing: "status-ongoing", completed: "status-completed" };

export default async function ProjectsListPage() {
  await connectToDatabase();
  const items = (await Project.find({ publishStatus: { $ne: "review" } }).sort({ publishedAt: -1, createdAt: -1 }).lean()) as unknown as ProjectItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">PROJECTS</span>
            <h1>Projects</h1>
          </div>
          <div className="sec-desc">
            <p>Applied builds carrying AILO&apos;s research into deployable systems.</p>
          </div>
        </div>

        {items.length === 0 && <EmptyState variant="public" title="No projects yet" message="Projects will appear here once they are published." actionHref="/" actionLabel="Back to homepage" />}

        <div className="projects-grid">
          {items.map((item, i) => (
            <Link key={item._id} href={`/projects/${item.slug}`} className="pcard">
              {item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed
                <img src={item.images[0]} alt="" className="pcard-thumb" style={{ objectFit: "cover", width: "100%" }} />
              ) : (
                <div className="pcard-thumb" />
              )}
              <div className="pcard-body">
                <div className="pcard-meta">
                  <span className="num">P{i + 1}</span>
                  <span className={`pstatus ${STATUS_CLASS[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                </div>
                <h3>{item.title}</h3>
                {(item.publishedAt ?? item.createdAt) && (
                  <span className="rcard-date">
                    {new Date(item.publishedAt ?? item.createdAt!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                <p>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
