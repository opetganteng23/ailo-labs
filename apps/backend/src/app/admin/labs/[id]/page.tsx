import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

import { createDeviceAction, deleteDeviceAction, updateDeviceAction } from "../actions";
import { LabForm } from "../LabForm";

export const dynamic = "force-dynamic";

export default async function AdminLabEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();

  const lab = await Lab.findById(id).lean<{
    _id: string;
    name: string;
    location?: string;
    capacity?: number;
    description?: string;
    facilities?: string;
    photos?: string[];
  }>();
  if (!lab) notFound();

  const devices = (await Device.find({ lab: id }).sort({ name: 1 }).lean()) as unknown as {
    _id: string;
    name: string;
    specification?: string;
    photo?: string;
    status: string;
  }[];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/labs" style={{ color: "#5b6664", fontWeight: 500 }}>
          Labs
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{lab.name}</span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{lab.name}</h1>

      <LabForm
        mode="edit"
        initial={{
          _id: String(lab._id),
          name: lab.name,
          location: lab.location,
          capacity: lab.capacity,
          description: lab.description,
          facilities: lab.facilities,
          photo: lab.photos?.[0],
        }}
      />

      <section className="admin2-section" style={{ marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: 17 }}>Devices in this lab</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
            Each device can be borrowed on its own from the booking page, separate from the whole lab.
          </p>
        </div>

        <form action={createDeviceAction} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 12, alignItems: "end" }}>
          <input type="hidden" name="lab" value={lab._id} />
          <div className="admin2-field">
            <label htmlFor="dname">Name</label>
            <input id="dname" name="name" required maxLength={160} />
          </div>
          <div className="admin2-field">
            <label htmlFor="dspec">Specification</label>
            <input id="dspec" name="specification" placeholder="e.g. RTX 4090, 64GB RAM" />
          </div>
          <div className="admin2-field">
            <label htmlFor="dstatus">Status</label>
            <select id="dstatus" name="status" defaultValue="available">
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button type="submit" className="admin2-btn" style={{ height: 46 }}>
            Add device
          </button>
        </form>

        {devices.length === 0 && <p style={{ fontSize: 14, color: "#6b7573" }}>No devices listed yet.</p>}

        {devices.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {devices.map((d) => (
              <div key={d._id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: 12, border: "1px solid #eeece6", borderRadius: 10 }}>
                <form action={updateDeviceAction} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexGrow: 1 }}>
                  <input type="hidden" name="id" value={d._id} />
                  <input type="hidden" name="lab" value={lab._id} />
                  <input name="name" defaultValue={d.name} required maxLength={160} style={{ width: 160 }} />
                  <input name="specification" defaultValue={d.specification ?? ""} placeholder="Specification" style={{ width: 200 }} />
                  <select name="status" defaultValue={d.status}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <button type="submit" className="admin2-btn outline">
                    Save
                  </button>
                </form>
                <form action={deleteDeviceAction}>
                  <input type="hidden" name="id" value={d._id} />
                  <input type="hidden" name="lab" value={lab._id} />
                  <ConfirmSubmit title="Delete this device?" message="It will be removed from this lab and can't be booked anymore." confirmLabel="Delete" className="admin2-btn danger">
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
