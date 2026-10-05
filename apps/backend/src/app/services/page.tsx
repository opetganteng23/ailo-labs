import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Service } from "@/models/catalog";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export const metadata = { title: "Services · AILO" };

type ServiceItem = { _id: string; title: string; slug: string; description?: string; image?: string };

export default async function ServicesPage() {
  await connectToDatabase();
  const items = (await Service.find({ status: "published" }).sort({ order: 1, title: 1 }).lean()) as unknown as ServiceItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">SERVICES</span>
            <h1>What AILO offers</h1>
          </div>
          <div className="sec-desc">
            <p>Services for partners, students and the public, backed by AILO&apos;s research and labs.</p>
          </div>
        </div>

        {items.length === 0 && <EmptyState variant="public" title="No services yet" message="Our services will appear here soon." actionHref="/" actionLabel="Back to homepage" />}

        <div className="research-grid">
          {items.map((item, i) => (
            <Link key={String(item._id)} href={`/services/${item.slug}`} className="rcard">
              <div className="rcard-top">
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
              {item.description && <p>{item.description}</p>}
              <span className="explore">Learn more</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
