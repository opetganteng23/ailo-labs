import Link from "next/link";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { listResearchInterests } from "@/lib/researchInterests";
import { Team } from "@/models/Team";

import { approveTeamChangesAction, rejectTeamChangesAction } from "../actions";
import { listTeamCategories } from "@/lib/teamCategoriesDb";

import { TeamForm } from "../TeamForm";

const FIELD_LABELS: Record<string, string> = {
  position: "Position",
  jenjang: "Highest degree",
  studyProgram: "Study program",
  bio: "Bio",
  photo: "Photo",
  researchInterests: "Research interests",
  profiles: "Academic profiles",
};

function show(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ") || "-";
  if (v && typeof v === "object") {
    return Object.entries(v as Record<string, string>)
      .filter(([, x]) => x)
      .map(([k, x]) => `${k}: ${x}`)
      .join("\n") || "-";
  }
  return String(v ?? "").trim() || "-";
}

export const dynamic = "force-dynamic";

export default async function AdminTeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await Team.findById(id).lean<{
    _id: string;
    name: string;
    position: string;
    category?: string;
    categories?: string[];
    jenjang?: string;
    studyProgram?: string;
    displayOrder?: number;
    bio?: string;
    researchInterests?: string[];
    email?: string;
    photo?: string;
    profiles?: { linkedin?: string; orcid?: string; googleScholar?: string; sinta?: string; scopus?: string };
    isActive: boolean;
    pendingChanges?: Record<string, unknown>;
    pendingSince?: Date;
  }>();
  if (!item) notFound();
  const interestSuggestions = await listResearchInterests();
  const categories = await listTeamCategories();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/team" style={{ color: "#5b6664", fontWeight: 500 }}>
          Team
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.name}</span>
      </div>
      {item.pendingChanges && (
        <section className="admin2-section" style={{ marginBottom: 20, borderColor: "#bfdadc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
              <h2 style={{ fontSize: 17 }}>Changes submitted by the lecturer</h2>
              <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
                Submitted {item.pendingSince ? new Date(item.pendingSince).toLocaleString("en-GB") : ""}. Approving applies them and makes the profile public.
              </p>
            </div>
            <form action={rejectTeamChangesAction}>
              <input type="hidden" name="id" value={String(item._id)} />
              <button type="submit" className="admin2-btn danger">
                Discard
              </button>
            </form>
            <form action={approveTeamChangesAction}>
              <input type="hidden" name="id" value={String(item._id)} />
              <button type="submit" className="admin2-btn">
                Approve &amp; publish
              </button>
            </form>
          </div>
          <div className="review-diff">
            <span className="review-diff-head">Field</span>
            <span className="review-diff-head">Current</span>
            <span className="review-diff-head">Submitted</span>
            {Object.entries(item.pendingChanges).map(([key, next]) => {
              const current = (item as unknown as Record<string, unknown>)[key];
              const changed = show(current) !== show(next);
              return (
                <div key={key} className={`review-diff-row${changed ? " changed" : ""}`}>
                  <span>{FIELD_LABELS[key] ?? key}</span>
                  {/* eslint-disable @next/next/no-img-element -- uploaded profile photos */}
                  <span>{key === "photo" && current ? <img src={String(current)} alt="" /> : show(current)}</span>
                  <span>{key === "photo" && next ? <img src={String(next)} alt="" /> : show(next)}</span>
                  {/* eslint-enable @next/next/no-img-element */}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <TeamForm
        mode="edit"
        categories={categories}
        interestSuggestions={interestSuggestions}
        initial={{
          _id: String(item._id),
          name: item.name,
          position: item.position,
          category: item.category,
          categories: item.categories,
          jenjang: item.jenjang,
          studyProgram: item.studyProgram,
          displayOrder: item.displayOrder,
          bio: item.bio,
          researchInterests: item.researchInterests ?? [],
          email: item.email,
          photo: item.photo,
          profiles: item.profiles,
          isActive: item.isActive,
        }}
      />
    </div>
  );
}
