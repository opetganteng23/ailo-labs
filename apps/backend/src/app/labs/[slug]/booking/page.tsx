import { notFound, redirect } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function LabBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/labs/${slug}/booking`)}`);
  }

  await connectToDatabase();
  const lab = await Lab.findOne({ slug, isActive: true }).lean<{ _id: string; name: string }>();

  if (!lab) notFound();

  const devices = (await Device.find({ lab: lab._id, status: "available" })
    .select("name")
    .lean()) as unknown as { _id: string; name: string }[];

  return (
    <>
      <SiteHeader />
      <main className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40, flexWrap: "wrap", marginBottom: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexGrow: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", color: "#b4530f" }}>LABS &amp; EQUIPMENT</span>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em" }}>Book {lab.name}</h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4e5957" }}>
              No account needed to browse, but sign-in identifies you. The lab admin reviews every request and confirms by email.
            </p>
          </div>
        </div>

        <BookingForm
          labId={String(lab._id)}
          labSlug={slug}
          labName={lab.name}
          devices={devices.map((d) => ({ _id: String(d._id), name: d.name }))}
          defaultName={session.name}
          defaultEmail={session.email}
        />
      </main>
      <SiteFooter />
    </>
  );
}
