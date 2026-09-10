import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

export default async function LabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const lab = await Lab.findOne({ slug, isActive: true }).lean<{
    _id: string;
    name: string;
    location?: string;
    capacity?: number;
    description?: string;
    facilities?: string;
    photos?: string[];
  }>();

  if (!lab) notFound();

  const devices = (await Device.find({ lab: lab._id }).sort({ name: 1 }).lean()) as unknown as {
    _id: string;
    name: string;
    specification?: string;
    status: string;
    photo?: string;
  }[];

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
        {lab.photos?.[0] && <img className="detail-thumb" src={lab.photos[0]} alt={lab.name} />}
        <h1>{lab.name}</h1>
        {lab.location && <p style={{ color: "#5b6469" }}>{lab.location}</p>}
        {lab.capacity !== undefined && <p>Capacity: {lab.capacity}</p>}
        <p style={{ marginTop: 12 }}>{lab.description}</p>
        {lab.facilities && (
          <p style={{ marginTop: 12, whiteSpace: "pre-line", color: "#3a4348" }}>
            <strong>Facilities: </strong>
            {lab.facilities}
          </p>
        )}
        <Link href={`/labs/${slug}/booking`} className="btn" style={{ marginTop: 20, display: "inline-block" }}>
          Ajukan Peminjaman
        </Link>

        <h2 style={{ marginTop: 40 }}>Devices</h2>
        {devices.length === 0 ? (
          <p className="notice">No devices listed yet.</p>
        ) : (
          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Specification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d._id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image, no static optimization needed */}
                    {d.photo ? <img src={d.photo} alt={d.name} style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 3 }} /> : "-"}
                  </td>
                  <td>{d.name}</td>
                  <td>{d.specification ?? "-"}</td>
                  <td>
                    <span className="badge">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 style={{ marginTop: 40 }}>Availability</h2>
        <p style={{ color: "#5b6469", fontSize: 13, marginTop: -8, marginBottom: 16 }}>
          Schedule for {lab.name}. Sign in and submit a request to reserve an open slot.
        </p>
        <AvailabilityCalendar labSlug={slug} />
      </main>
      <SiteFooter />
    </>
  );
}
