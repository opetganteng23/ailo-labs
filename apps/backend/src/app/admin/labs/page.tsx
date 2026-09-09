import Link from "next/link";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Lab } from "@/models/Lab";

import { createLabAction, deleteLabAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLabsPage() {
  await connectToDatabase();
  const items = (await Lab.find().sort({ name: 1 }).lean()) as unknown as {
    _id: string;
    name: string;
    location?: string;
  }[];

  return (
    <div>
      <h1>Labs</h1>
      <p style={{ color: "#5b6469", fontSize: 13 }}>
        Click a lab&apos;s name below to edit its details and manage its devices, or{" "}
        <Link href="/admin/labs/devices">see every device across all labs</Link>.
      </p>
      <form className="stack" action={createLabAction} style={{ marginTop: 24 }}>
        <label>
          Name
          <input name="name" required maxLength={160} />
        </label>
        <label>
          Location
          <input name="location" />
        </label>
        <label>
          Capacity
          <input name="capacity" type="number" min={0} />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <label>
          Facilities / specification
          <textarea name="facilities" placeholder="e.g. 20x workstation, 4K projector, whiteboard wall" />
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
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>
                <Link href={`/admin/labs/${item._id}`}>{item.name}</Link>
              </td>
              <td>{item.location ?? "-"}</td>
              <td>
                <form action={deleteLabAction}>
                  <input type="hidden" name="id" value={item._id} />
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
