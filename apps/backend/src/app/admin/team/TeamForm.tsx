"use client";

import { ImageUploadField } from "@/components/ImageUploadField";
import { TagInput } from "@/components/TagInput";
import { TEAM_CATEGORIES } from "@/models/teamCategories";

import { createTeamAction, updateTeamAction } from "./actions";

type TeamFormProps = {
  mode?: "create" | "edit";
  /** Interests already used by other members, offered as suggestions. */
  interestSuggestions?: string[];
  initial?: {
    _id: string;
    name: string;
    position: string;
    category?: string;
    jenjang?: string;
    studyProgram?: string;
    displayOrder?: number;
    bio?: string;
    researchInterests?: string[];
    email?: string;
    photo?: string;
    profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
    isActive?: boolean;
  };
};

export function TeamForm({ mode = "create", initial, interestSuggestions = [] }: TeamFormProps) {
  const profiles = initial?.profiles ?? {};

  return (
    <form action={mode === "edit" ? updateTeamAction : createTeamAction}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label htmlFor="name">
                Name<span className="req">*</span>
              </label>
              <input id="name" name="name" type="text" required maxLength={160} defaultValue={initial?.name} />
            </div>
            <div className="admin2-field">
              <label htmlFor="position">
                Position<span className="req">*</span>
              </label>
              <input id="position" name="position" type="text" required maxLength={160} defaultValue={initial?.position} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
              <div className="admin2-field">
                <label htmlFor="jenjang">Jenjang</label>
                <input id="jenjang" name="jenjang" type="text" placeholder="S1 / S2 / S3" defaultValue={initial?.jenjang} />
              </div>
              <div className="admin2-field">
                <label htmlFor="studyProgram">Study program</label>
                <input id="studyProgram" name="studyProgram" type="text" placeholder="Informatics" defaultValue={initial?.studyProgram} />
              </div>
              <div className="admin2-field">
                <label htmlFor="displayOrder">Display order</label>
                <input id="displayOrder" name="displayOrder" type="number" defaultValue={initial?.displayOrder ?? 0} />
              </div>
            </div>
            <div className="admin2-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue={initial?.email} />
            </div>
            <div className="admin2-field">
              <label>
                Research interests <span style={{ fontWeight: 500, color: "#6b7573" }}>(tags, used for filtering on the public team page)</span>
              </label>
              <TagInput name="researchInterests" defaultValue={initial?.researchInterests} suggestions={interestSuggestions} placeholder="e.g. NLP, Computer Vision…" />
            </div>
            <div className="admin2-field">
              <label htmlFor="bio">Bio</label>
              <textarea id="bio" name="bio" rows={4} defaultValue={initial?.bio} />
            </div>
          </section>

          <section className="admin2-section">
            <h2 style={{ fontSize: 17 }}>Academic profiles</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div className="admin2-field">
                <label htmlFor="linkedin">LinkedIn</label>
                <input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/..." defaultValue={profiles.linkedin} />
              </div>
              <div className="admin2-field">
                <label htmlFor="orcid">ORCID</label>
                <input id="orcid" name="orcid" type="url" placeholder="https://orcid.org/..." defaultValue={profiles.orcid} />
              </div>
              <div className="admin2-field">
                <label htmlFor="googleScholar">Google Scholar</label>
                <input id="googleScholar" name="googleScholar" type="url" placeholder="https://scholar.google.com/..." defaultValue={profiles.googleScholar} />
              </div>
              <div className="admin2-field">
                <label htmlFor="sinta">SINTA</label>
                <input id="sinta" name="sinta" type="url" placeholder="https://sinta.kemdikbud.go.id/..." defaultValue={profiles.sinta} />
              </div>
              <div className="admin2-field">
                <label htmlFor="scopus">Scopus</label>
                <input id="scopus" name="scopus" type="url" placeholder="https://scopus.com/authid/..." defaultValue={profiles.scopus} />
              </div>
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Category</h2>
            <select name="category" defaultValue={initial?.category ?? "Peneliti"}>
              {TEAM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </section>

          <section className="admin2-section pad-sm">
            <h2>Photo</h2>
            <ImageUploadField name="photo" label="" defaultValue={initial?.photo} hint="Square portrait - PNG, JPG or WEBP" />
          </section>

          {mode === "edit" && (
            <section className="admin2-section pad-sm">
              <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex", fontWeight: 500 }}>
                <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} style={{ width: "auto" }} />
                Active (shown on public site)
              </label>
            </section>
          )}

          <button type="submit" className="admin2-btn" style={{ width: "100%", justifyContent: "center" }}>
            {mode === "edit" ? "Save changes" : "Add member"}
          </button>
        </div>
      </div>
    </form>
  );
}
