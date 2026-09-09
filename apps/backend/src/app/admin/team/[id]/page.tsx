import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

import { updateTeamAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await Team.findById(id).lean<{
    _id: string;
    name: string;
    position: string;
    bio?: string;
    email?: string;
    photo?: string;
    isActive: boolean;
  }>();
  if (!item) notFound();

  return (
    <div>
      <p>
        <Link href="/admin/team">Team</Link> / {item.name}
      </p>
      <h1>Edit team member</h1>

      <form className="stack" action={updateTeamAction} style={{ marginTop: 24 }}>
        <input type="hidden" name="id" value={item._id} />
        <label>
          Name
          <input name="name" required maxLength={160} defaultValue={item.name} />
        </label>
        <label>
          Position
          <input name="position" required maxLength={160} defaultValue={item.position} />
        </label>
        <label>
          Bio
          <textarea name="bio" defaultValue={item.bio ?? ""} />
        </label>
        <label>
          Email
          <input name="email" type="email" defaultValue={item.email ?? ""} />
        </label>
        <ImageUploadField name="photo" label="Photo" defaultValue={item.photo} />
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}>
          <input type="checkbox" name="isActive" defaultChecked={item.isActive} style={{ width: "auto" }} />
          Active
        </label>
        <button type="submit" className="btn">
          Save changes
        </button>
      </form>
    </div>
  );
}
