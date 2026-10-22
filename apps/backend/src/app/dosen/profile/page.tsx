import { ImageUploadField } from "@/components/ImageUploadField";
import { TagInput } from "@/components/TagInput";
import { WorksEditor } from "@/components/WorksEditor";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { listResearchInterests } from "@/lib/researchInterests";
import type { Work } from "@/lib/teamWorks";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

import { saveDosenProfileAction } from "../actions";

export const dynamic = "force-dynamic";

type Profile = {
  position?: string;
  jenjang?: string;
  studyProgram?: string;
  bio?: string;
  photo?: string;
  researchInterests?: string[];
  works?: Work[];
  profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
};

export default async function DosenProfilePage() {
  const session = (await getSession())!;
  await connectToDatabase();
  const user = await User.findById(session.sub).lean<{ team?: unknown }>();
  const team = user?.team
    ? await Team.findById(user.team).lean<Profile & { name: string; slug: string; email?: string; isActive: boolean; pendingChanges?: Profile; pendingSince?: Date }>()
    : null;

  if (!team) {
    return (
      <div>
        <div className="admin2-header">
          <div>
            <h1>My profile</h1>
            <p>Your profile on the public team page.</p>
          </div>
        </div>
        <section className="admin2-section pad-sm" style={{ maxWidth: 640 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>Your account isn&apos;t linked to a team profile yet. Ask an AILO admin to link it from the Users page in the admin console.</p>
        </section>
      </div>
    );
  }

  // Show what's waiting for approval if there is something, otherwise the live profile.
  const v: Profile = { ...team, ...(team.pendingChanges ?? {}) };
  const p = v.profiles ?? {};
  const interestSuggestions = await listResearchInterests();

  return (
    <form action={saveDosenProfileAction}>
      <div className="admin2-header">
        <div>
          <h1>My profile</h1>
          <p>How you appear on the public team page. Changes are published after an admin approves them.</p>
        </div>
        <div className="admin2-actions">
          {team.isActive && !team.pendingSince && (
            <a href={`/team/${team.slug}`} target="_blank" rel="noopener noreferrer" className="admin2-btn outline">
              View public profile
            </a>
          )}
          <button type="submit" className="admin2-btn">
            Submit for approval
          </button>
        </div>
      </div>

      {team.pendingSince && (
        <div className="admin2-banner" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <strong>Waiting for admin approval</strong>
            <span className="sub">Submitted {new Date(team.pendingSince).toLocaleString("en-GB")}. The form below shows your submitted version; the public page still shows the previous one.</span>
          </div>
        </div>
      )}
      {!team.isActive && !team.pendingSince && (
        <div className="admin2-banner" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <strong>Your profile isn&apos;t public yet</strong>
            <span className="sub">Fill it in and submit it; an admin publishes it on the team page.</span>
          </div>
        </div>
      )}

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label>Name</label>
              <input value={team.name} disabled />
              <span style={{ fontSize: 12.5, color: "#6b7573" }}>Name and email come from your membership; ask an admin to change them.</span>
            </div>
            <div className="admin2-field">
              <label htmlFor="position">
                Position<span className="req">*</span>
              </label>
              <input id="position" name="position" required maxLength={160} defaultValue={v.position} placeholder="e.g. Lecturer, School of Computing" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div className="admin2-field">
                <label htmlFor="jenjang">Highest degree</label>
                <input id="jenjang" name="jenjang" defaultValue={v.jenjang} placeholder="S2 / S3" />
              </div>
              <div className="admin2-field">
                <label htmlFor="studyProgram">Study program / unit</label>
                <input id="studyProgram" name="studyProgram" defaultValue={v.studyProgram} placeholder="Informatics" />
              </div>
            </div>
            <div className="admin2-field">
              <label>
                Research interests <span style={{ fontWeight: 500, color: "#6b7573" }}>(tags)</span>
              </label>
              <TagInput name="researchInterests" defaultValue={v.researchInterests ?? []} suggestions={interestSuggestions} placeholder="e.g. NLP, Computer Vision…" />
            </div>
            <div className="admin2-field">
              <label htmlFor="bio">Bio</label>
              <textarea id="bio" name="bio" rows={5} defaultValue={v.bio} />
            </div>
          </section>

          <section className="admin2-section">
            <h2 style={{ fontSize: 17 }}>Karya dan kontribusi</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: "#5b6664" }}>Riset, produk atau ciptaan, publikasi, paten, dan buku Anda. Isi tautan agar pengunjung bisa membuka detailnya.</p>
            <WorksEditor defaultValue={v.works} />
          </section>

          <section className="admin2-section">
            <h2 style={{ fontSize: 17 }}>Academic profiles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              {(
                [
                  ["linkedin", "LinkedIn", "https://linkedin.com/in/..."],
                  ["orcid", "ORCID", "https://orcid.org/..."],
                  ["googleScholar", "Google Scholar", "https://scholar.google.com/..."],
                  ["sinta", "SINTA", "https://sinta.kemdikbud.go.id/..."],
                  ["scopus", "Scopus", "https://scopus.com/authid/..."],
                ] as const
              ).map(([key, label, ph]) => (
                <div key={key} className="admin2-field">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} name={key} type="url" placeholder={ph} defaultValue={p[key]} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Photo</h2>
            <ImageUploadField name="photo" label="" defaultValue={v.photo} hint="Square portrait - PNG, JPG or WEBP" />
          </section>
          <button type="submit" className="admin2-btn" style={{ width: "100%", justifyContent: "center" }}>
            Submit for approval
          </button>
        </div>
      </div>
    </form>
  );
}
