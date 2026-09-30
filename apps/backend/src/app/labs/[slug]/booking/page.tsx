import Link from "next/link";
import { notFound } from "next/navigation";

import { MinimalSiteHeader } from "@/components/MinimalSiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function LabBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const lab = await Lab.findOne({ slug, isActive: true }).lean<{ _id: string; name: string }>();

  if (!lab) notFound();

  const devices = (await Device.find({ lab: lab._id, status: "available" })
    .select("name")
    .lean()) as unknown as { _id: string; name: string }[];

  return (
    <>
      <MinimalSiteHeader backHref={`/labs/${slug}`} />
      <main className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40, flexWrap: "wrap", marginBottom: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexGrow: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#b4530f" }}>LABS &amp; EQUIPMENT</span>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em" }}>Book {lab.name}</h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4e5957" }}>
              For AILO members - no account needed. Enter your member card number; the lab admin reviews every request and emails you an access QR once approved.{" "}
              <Link href="/join" style={{ color: "#00809d", fontWeight: 700 }}>
                Not a member yet?
              </Link>
            </p>
          </div>
        </div>

        <BookingForm
          labId={String(lab._id)}
          labSlug={slug}
          labName={lab.name}
          devices={devices.map((d) => ({ _id: String(d._id), name: d.name }))}
        />
      </main>
    </>
  );
}
