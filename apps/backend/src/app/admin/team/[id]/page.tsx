import Link from "next/link";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/models/Team";

import { TeamForm } from "../TeamForm";

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

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#5b6664", marginBottom: 20 }}>
        <Link href="/admin/team" style={{ color: "#5b6664", fontWeight: 500 }}>
          Team
        </Link>
        <span>/</span>
        <span style={{ color: "#15201f", fontWeight: 600 }}>{item.name}</span>
      </div>
      <TeamForm
        mode="edit"
        initial={{
          _id: String(item._id),
          name: item.name,
          position: item.position,
          category: item.category,
          jenjang: item.jenjang,
          studyProgram: item.studyProgram,
          displayOrder: item.displayOrder,
          bio: item.bio,
          email: item.email,
          photo: item.photo,
          profiles: item.profiles,
          isActive: item.isActive,
        }}
      />
    </div>
  );
}
