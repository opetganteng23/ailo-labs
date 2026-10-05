import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { sanitizeRichText } from "@/lib/sanitizeHtml";
import { Service } from "@/models/catalog";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const item = await Service.findOne({ slug, status: "published" }).lean<{
    title: string;
    description?: string;
    content?: string;
    image?: string;
  }>();

  if (!item) notFound();

  return (
    <>
      <SiteHeader backHref="/services" />
      <main className="wrap page-head" style={{ maxWidth: 820 }}>
        <Link href="/services" className="sec-link" style={{ fontSize: 14 }}>
          Services
        </Link>
        <h1 style={{ marginTop: 12 }}>{item.title}</h1>
        {item.description && <p style={{ color: "#5b6469", fontSize: 17 }}>{item.description}</p>}
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image
          <img className="detail-thumb" src={item.image} alt={item.title} style={{ borderRadius: 20 }} />
        )}
        {item.content && <div className="rte-body" style={{ marginTop: 24, padding: 0 }} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.content) }} />}
      </main>
      <SiteFooter />
    </>
  );
}
