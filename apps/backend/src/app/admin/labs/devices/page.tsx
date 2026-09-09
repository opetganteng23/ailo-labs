import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";

import { createDeviceAction, deleteDeviceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDevicesPage() {
  await connectToDatabase();
  const labs = (await Lab.find().sort({ name: 1 }).lean()) as unknown as { _id: string; name: string }[];
  const devices = (await Device.find().populate("lab", "name").sort({ name: 1 }).lean()) as unknown as {
    _id: string;
    name: string;
    specification?: string;
    status: string;
    lab?: { name?: string };
  }[];

  return (
    <div>
      <h1>Devices</h1>
      <form className="stack" action={createDeviceAction} style={{ marginTop: 24 }}>
        <label>
          Lab
          <select name="lab" required>
            {labs.map((lab) => (
              <option key={lab._id} value={lab._id}>
                {lab.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input name="name" required maxLength={160} />
        </label>
        <label>
          Specification
          <input name="specification" />
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
          Create
        </button>
      </form>

      <table style={{ marginTop: 32 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Lab</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td>{d.lab?.name ?? "-"}</td>
              <td>
                <span className="badge">{d.status}</span>
              </td>
              <td>
                <form action={deleteDeviceAction}>
                  <input type="hidden" name="id" value={d._id} />
                  <button type="submit" className="btn danger">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
