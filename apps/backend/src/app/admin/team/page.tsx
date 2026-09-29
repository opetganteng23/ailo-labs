import Link from "next/link";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { TEAM_CATEGORIES, Team } from "@/models/Team";

import { createTeamAction, deleteTeamAction } from "./actions";

export const dynamic = "force-dynamic";

type TeamItem = { _id: string; name: string; position: string; category?: string };

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  await connectToDatabase();
  const allItems = (await Team.find().sort({ category: 1, displayOrder: 1, name: 1 }).lean()) as unknown as TeamItem[];
  const items = category ? allItems.filter((i) => i.category === category) : allItems;

  const counts: Record<string, number> = { All: allItems.length };
  for (const cat of TEAM_CATEGORIES) {
    counts[cat] = allItems.filter((i) => i.category === cat).length;
  }

  return (
    <div>
      <h1>Team</h1>

      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        <Link href="/admin/team" className={`btn ${!category ? "" : "outline"}`}>
          All {counts.All}
        </Link>
        {TEAM_CATEGORIES.map((cat) => (
          <Link key={cat} href={`/admin/team?category=${encodeURIComponent(cat)}`} className={`btn ${category === cat ? "" : "outline"}`}>
            {cat} {counts[cat]}
          </Link>
        ))}
      </div>

      <form className="stack" action={createTeamAction} style={{ marginTop: 8 }}>
        <label>
          Name
          <input name="name" required maxLength={160} />
        </label>
        <ImageUploadField name="photo" label="Photo" />
        <label>
          Position
          <input name="position" required maxLength={160} />
        </label>
        <label>
          Category
          <select name="category" defaultValue="Peneliti">
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
            <input name="jenjang" placeholder="S1 / S2 / S3" />
          </label>
          <label>
            Study program
            <input name="studyProgram" placeholder="Informatics" />
          </label>
          <label>
            Display order
            <input name="displayOrder" type="number" defaultValue={0} />
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Bio
          <textarea name="bio" />
        </label>

        <h3 style={{ marginTop: 8 }}>Academic profiles</h3>
        <div className="grid cols-3">
          <label>
            LinkedIn
            <input name="linkedin" placeholder="https://linkedin.com/in/..." />
          </label>
          <label>
            ORCID
            <input name="orcid" placeholder="https://orcid.org/..." />
          </label>
          <label>
            Google Scholar
            <input name="googleScholar" placeholder="https://scholar.google.com/..." />
          </label>
          <label>
            SINTA
            <input name="sinta" placeholder="https://sinta.kemdikbud.go.id/..." />
          </label>
          <label>
            Scopus
            <input name="scopus" placeholder="https://scopus.com/authid/..." />
          </label>
        </div>

        <button type="submit" className="btn">
          Add member
        </button>
      </form>

      <table style={{ marginTop: 32 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Category</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.position}</td>
              <td>{item.category ?? "-"}</td>
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
