import { EmptyState } from "@/components/EmptyState";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Partner } from "@/models/catalog";

export const dynamic = "force-dynamic";

export const metadata = { title: "Partners · AILO" };

type PartnerItem = { _id: string; title: string; description?: string; image?: string; link?: string; logoDark?: boolean };

export default async function PartnersPage() {
  await connectToDatabase();
  const items = (await Partner.find({ status: "published" }).sort({ order: 1, title: 1 }).lean()) as unknown as PartnerItem[];

  return (
    <>
      <SiteHeader />
      <main className="wrap page-head">
        <div className="sec-head">
          <div>
            <span className="kicker-sm">PARTNERS</span>
            <h1>Our partners</h1>
          </div>
          <div className="sec-desc">
            <p>Institutions and companies AILO works with on research, education and applied projects.</p>
          </div>
        </div>

        {items.length === 0 && <EmptyState variant="public" title="No partners yet" message="Our partners will appear here soon." actionHref="/" actionLabel="Back to homepage" />}

        <div className="partner-grid">
          {items.map((item) => {
            const inner = (
              <>
                <div className={`partner-logo${item.logoDark ? " dark" : ""}`}>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <span>{item.title}</span>
                  )}
                </div>
                <b>{item.title}</b>
              </>
            );
            return item.link ? (
              <a key={String(item._id)} href={item.link} target="_blank" rel="noopener noreferrer" className="partner-card">
                {inner}
              </a>
            ) : (
              <div key={String(item._id)} className="partner-card">
                {inner}
              </div>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
