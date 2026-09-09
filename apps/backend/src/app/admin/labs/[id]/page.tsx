import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

import { createDeviceAction, deleteDeviceAction, updateDeviceAction, updateLabAction } from "../actions";

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
      <p>
        <Link href="/admin/labs">Labs</Link> / {lab.name}
      </p>
      <h1>{lab.name}</h1>

      <form className="stack" action={updateLabAction} style={{ marginTop: 24, maxWidth: 640 }}>
        <input type="hidden" name="id" value={lab._id} />
        <label>
          Location
          <input name="location" defaultValue={lab.location ?? ""} />
        </label>
        <label>
          Capacity
          <input name="capacity" type="number" min={0} defaultValue={lab.capacity ?? ""} />
        </label>
        <label>
          Description
          <textarea name="description" defaultValue={lab.description ?? ""} />
        </label>
        <label>
          Facilities / specification
          <textarea
            name="facilities"
            placeholder="e.g. 20x workstation, 4K projector, whiteboard wall"
            defaultValue={lab.facilities ?? ""}
          />
        </label>
        <ImageUploadField name="photo" label="Photo" defaultValue={lab.photos?.[0]} />
        <button type="submit" className="btn">
          Save changes
        </button>
      </form>

      <h2 style={{ marginTop: 40 }}>Devices in this lab</h2>
      <p style={{ color: "#5b6469", fontSize: 13, marginTop: -8 }}>
        Each device can be borrowed on its own from the booking page, separate from the whole lab.
      </p>

      <form className="stack" action={createDeviceAction} style={{ marginTop: 16, maxWidth: 640 }}>
        <input type="hidden" name="lab" value={lab._id} />
        <label>
          Name
          <input name="name" required maxLength={160} />
        </label>
        <label>
          Specification
          <input name="specification" placeholder="e.g. RTX 4090, 64GB RAM" />
        </label>
        <label>
          Status
          <select name="status" defaultValue="available">
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </label>
        <ImageUploadField name="photo" label="Photo" />
        <button type="submit" className="btn">
          Add device
        </button>
      </form>

      {devices.length === 0 && (
        <p className="notice" style={{ marginTop: 24 }}>
          No devices listed yet.
        </p>
      )}

      {devices.length > 0 && (
        <table style={{ marginTop: 24 }}>
          <thead>
            <tr>
              <th>Device</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d._id}>
                <td style={{ paddingTop: 14, paddingBottom: 14 }}>
                  <form
                    className="stack"
                    action={updateDeviceAction}
                    style={{ gap: 8, flexDirection: "row", alignItems: "center", flexWrap: "wrap", maxWidth: "none" }}
                  >
                    <input type="hidden" name="id" value={d._id} />
                    <input type="hidden" name="lab" value={lab._id} />
                    <input name="name" defaultValue={d.name} required maxLength={160} style={{ width: 160 }} />
                    <input name="specification" defaultValue={d.specification ?? ""} placeholder="Specification" style={{ width: 200 }} />
                    <select name="status" defaultValue={d.status}>
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    <button type="submit" className="btn outline">
                      Save
                    </button>
                  </form>
                </td>
                <td style={{ verticalAlign: "middle" }}>
                  <form action={deleteDeviceAction}>
                    <input type="hidden" name="id" value={d._id} />
                    <input type="hidden" name="lab" value={lab._id} />
                    <button type="submit" className="btn danger">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
