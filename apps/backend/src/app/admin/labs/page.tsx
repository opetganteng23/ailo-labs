import Link from "next/link";

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
      <p>
        <Link href="/admin/labs/devices">Manage devices</Link>
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
              <td>{item.name}</td>
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
