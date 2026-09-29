import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { TEAM_CATEGORIES, Team } from "@/models/Team";

import { updateTeamAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await Team.findById(id).lean<{
    _id: string;
    name: string;
    position: string;
    category?: string;
    jenjang?: string;
    studyProgram?: string;
    displayOrder?: number;
    bio?: string;
    email?: string;
    photo?: string;
    profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
    isActive: boolean;
  }>();
  if (!item) notFound();

  const profiles = item.profiles ?? {};

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
        <ImageUploadField name="photo" label="Photo" defaultValue={item.photo} />
        <label>
          Position
          <input name="position" required maxLength={160} defaultValue={item.position} />
        </label>
        <label>
          Category
          <select name="category" defaultValue={item.category ?? "Peneliti"}>
            {TEAM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <div className="grid cols-3">
          <label>
            Jenjang
            <input name="jenjang" placeholder="S1 / S2 / S3" defaultValue={item.jenjang ?? ""} />
          </label>
          <label>
            Study program
            <input name="studyProgram" placeholder="Informatics" defaultValue={item.studyProgram ?? ""} />
          </label>
          <label>
            Display order
            <input name="displayOrder" type="number" defaultValue={item.displayOrder ?? 0} />
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" defaultValue={item.email ?? ""} />
        </label>
        <label>
          Bio
          <textarea name="bio" defaultValue={item.bio ?? ""} />
        </label>

        <h3 style={{ marginTop: 8 }}>Academic profiles</h3>
        <div className="grid cols-3">
          <label>
            LinkedIn
            <input name="linkedin" placeholder="https://linkedin.com/in/..." defaultValue={profiles.linkedin ?? ""} />
          </label>
          <label>
            ORCID
            <input name="orcid" placeholder="https://orcid.org/..." defaultValue={profiles.orcid ?? ""} />
          </label>
          <label>
            Google Scholar
            <input name="googleScholar" placeholder="https://scholar.google.com/..." defaultValue={profiles.googleScholar ?? ""} />
          </label>
          <label>
            SINTA
            <input name="sinta" placeholder="https://sinta.kemdikbud.go.id/..." defaultValue={profiles.sinta ?? ""} />
          </label>
          <label>
            Scopus
            <input name="scopus" placeholder="https://scopus.com/authid/..." defaultValue={profiles.scopus ?? ""} />
          </label>
        </div>

        <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}>
          <input type="checkbox" name="isActive" defaultChecked={item.isActive} style={{ width: "auto" }} />
          Active (shown on public site)
        </label>
        <button type="submit" className="btn">
          Save changes
        </button>
      </form>
    </div>
  );
}
