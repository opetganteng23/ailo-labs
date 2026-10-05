import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

import { createDeviceAction, deleteDeviceAction } from "../actions";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  await connectToDatabase();
  const labs = (await Lab.find().sort({ name: 1 }).lean()) as unknown as { _id: string; name: string }[];
  const devices = (await Device.find().populate("lab", "name").sort({ name: 1 }).lean()) as unknown as {
    _id: string;
    name: string;
    specification?: string;
    status: "available" | "booked" | "maintenance";
    lab?: { _id?: string; name?: string };
  }[];

  const STATUS_PILL: Record<string, string> = { available: "approved", booked: "pending", maintenance: "rejected" };

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Devices</h1>
          <p>Every device across all labs.</p>
        </div>
      </div>

      <section className="admin2-section" style={{ marginBottom: 20 }}>
        <h2>Add a device</h2>
        <form action={createDeviceAction} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, alignItems: "end" }}>
          <div className="admin2-field">
            <label htmlFor="lab">Lab</label>
            <select id="lab" name="lab" required>
              {labs.map((lab) => (
                <option key={lab._id} value={lab._id}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin2-field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required maxLength={160} />
          </div>
          <div className="admin2-field">
            <label htmlFor="specification">Specification</label>
            <input id="specification" name="specification" />
          </div>
          <div className="admin2-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue="available">
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <ImageUploadField name="photo" label="Photo" />
          </div>
          <button type="submit" className="admin2-btn" style={{ gridColumn: "1 / -1", justifySelf: "start" }}>
            Add device
          </button>
        </form>
      </section>

      <section className="admin2-panel">
        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1fr) 160px 130px 56px" }}>
          <span>NAME</span>
          <span>LAB</span>
          <span>STATUS</span>
          <span></span>
        </div>
        {devices.length === 0 && <EmptyState title="No devices yet" message="Devices are added from a lab's page, under its equipment list." actionHref="/admin/labs" actionLabel="Go to labs" />}
        {devices.map((d) => (
          <div key={d._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1fr) 160px 130px 56px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{d.name}</span>
              {d.specification && <span style={{ fontSize: 13, color: "#6b7573" }}>{d.specification}</span>}
            </div>
            <span style={{ fontSize: 14, color: "#3b4947" }}>
              {d.lab?._id ? <Link href={`/admin/labs/${d.lab._id}`}>{d.lab.name}</Link> : "-"}
            </span>
            <span className={`admin2-pill ${STATUS_PILL[d.status]}`}>
              <span className="dot" />
              {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
            </span>
            <form action={deleteDeviceAction}>
              <input type="hidden" name="id" value={d._id} />
              <input type="hidden" name="lab" value={d.lab?._id ?? ""} />
              <ConfirmSubmit title="Delete this device?" message="It will be removed from its lab and can't be booked anymore." confirmLabel="Delete" ariaLabel="Delete device" className="admin2-btn ghost" style={{ padding: 0, width: 40, height: 40, justifyContent: "center", color: "#9d1b1b" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z" />
                </svg>
              </ConfirmSubmit>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
