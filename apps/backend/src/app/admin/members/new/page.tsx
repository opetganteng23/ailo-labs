import Link from "next/link";

import { ImageUploadField } from "@/components/ImageUploadField";
import { listMemberFaculties } from "@/lib/memberFacultiesDb";
import { MEMBER_CATEGORIES } from "@/models/Member";

import { createMemberAction } from "../actions";

export const dynamic = "force-dynamic";

const STUDY_LEVELS = ["S1", "S2", "S3"] as const;

/** Admin adds a member directly: the card is issued at once and emailed to the address entered. */
export default async function AdminMemberNewPage() {
  const faculties = await listMemberFaculties();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="admin2-page">
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/members" style={{ color: "#5b6664", fontWeight: 500 }}>
          Members
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>Add member</span>
      </div>

      <form action={createMemberAction} className="admin2-panel" style={{ maxWidth: 760, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Add member</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#5b6664" }}>
            For people you register yourself. There is no application to review: the card is issued immediately and can be emailed to the address below.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div className="admin2-field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" required style={{ height: 42 }} />
          </div>
          <div className="admin2-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required style={{ height: 42 }} placeholder="The card is sent here" />
          </div>
          <div className="admin2-field">
            <label htmlFor="approvedAs">Member category</label>
            <select id="approvedAs" name="approvedAs" defaultValue="Peneliti Mahasiswa" style={{ height: 42 }}>
              {MEMBER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, lineHeight: 1.4, color: "#6b7573" }}>&quot;Dosen&quot; also creates a lecturer dashboard account.</span>
          </div>
          <div className="admin2-field">
            <label htmlFor="validUntil">Valid until</label>
            <input id="validUntil" name="validUntil" type="date" required min={today} defaultValue={nextYear.toISOString().slice(0, 10)} style={{ height: 42 }} />
          </div>
          <div className="admin2-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="affiliation">Affiliation</label>
            <input id="affiliation" name="affiliation" type="text" required defaultValue="Telkom University" style={{ height: 42 }} placeholder="e.g. Telkom University · S1 Informatika" />
          </div>
          <div className="admin2-field">
            <label htmlFor="studyLevel">
              Study level <span style={{ fontWeight: 500, color: "#6b7573" }}>(students)</span>
            </label>
            <select id="studyLevel" name="studyLevel" defaultValue="" style={{ height: 42 }}>
              <option value="">Not applicable</option>
              {STUDY_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="admin2-field">
            <label htmlFor="faculty">Faculty</label>
            <select id="faculty" name="faculty" defaultValue="" style={{ height: 42 }}>
              <option value="">Not applicable</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="admin2-field">
            <label htmlFor="phone">
              Phone <span style={{ fontWeight: 500, color: "#6b7573" }}>(optional)</span>
            </label>
            <input id="phone" name="phone" type="text" style={{ height: 42 }} />
          </div>
          <div className="admin2-field">
            <label htmlFor="referee">
              Referee Dosen <span style={{ fontWeight: 500, color: "#6b7573" }}>(optional, supervising lecturer)</span>
            </label>
            <input id="referee" name="referee" type="text" maxLength={160} style={{ height: 42 }} />
          </div>
        </div>

        <ImageUploadField name="photo" label="Photo" hint="Shown on the member card. You can add it later with Edit member details." />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 12, background: "#f7f6f2" }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
            <input type="checkbox" name="sendEmail" defaultChecked style={{ width: 18, height: 18 }} />
            Email the digital card to this address now
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, fontWeight: 400 }}>
            <input type="checkbox" name="includeInTeamBoard" style={{ width: 18, height: 18 }} />
            Also show this person on the public People page
          </label>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="admin2-btn" style={{ height: 46 }}>
            Add member &amp; issue card
          </button>
          <Link href="/admin/members" className="admin2-btn outline" style={{ height: 46 }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
