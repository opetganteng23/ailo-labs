import Link from "next/link";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

import { createTeamAction, deleteTeamAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  await connectToDatabase();
  const items = (await Team.find().sort({ name: 1 }).lean()) as unknown as {
    _id: string;
    name: string;
    position: string;
  }[];

  return (
    <div>
      <h1>Team</h1>
      <form className="stack" action={createTeamAction} style={{ marginTop: 24 }}>
        <label>
          Name
          <input name="name" required maxLength={160} />
        </label>
        <label>
          Position
          <input name="position" required maxLength={160} />
        </label>
        <label>
          Bio
          <textarea name="bio" />
        </label>
        <label>
          Email
          <input name="email" type="email" />
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
            <th>Position</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.position}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <Link href={`/admin/team/${item._id}`} className="btn outline">
                  Edit
                </Link>
                <form action={deleteTeamAction}>
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
