import { notFound, redirect } from "next/navigation";

import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
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
      <main className="wrap">
        <h1>Book {lab.name}</h1>
        <p>Submit a request, an admin will review and approve it, then you&apos;ll get an email decision.</p>
        <div style={{ marginTop: 24, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 320px", minWidth: 320 }}>
            <BookingForm
              labId={String(lab._id)}
              devices={devices.map((d) => ({ _id: String(d._id), name: d.name }))}
              defaultName={session.name}
              defaultEmail={session.email}
            />
          </div>
          <AvailabilityCalendar labSlug={slug} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
