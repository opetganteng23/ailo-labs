import Link from "next/link";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function DosenOverviewPage() {
  const session = (await getSession())!;
  await connectToDatabase();
  const user = await User.findById(session.sub).lean<{ team?: unknown }>();
  const [research, projects, news, team] = await Promise.all([
    Research.find({ owner: session.sub }).select("status").lean<{ status: string }[]>(),
    Project.find({ owner: session.sub }).select("publishStatus").lean<{ publishStatus: string }[]>(),
    News.find({ author: session.sub }).select("status").lean<{ status: string }[]>(),
    user?.team ? Team.findById(user.team).select("isActive pendingSince slug").lean<{ isActive: boolean; pendingSince?: Date; slug: string }>() : null,
  ]);

  const cards = [
    { label: "My research", href: "/dosen/research", accent: "research", total: research.length, review: research.filter((r) => r.status === "review").length },
    { label: "My projects", href: "/dosen/projects", accent: "projects", total: projects.length, review: projects.filter((p) => p.publishStatus === "review").length },
    { label: "News drafts", href: "/dosen/news", accent: "news", total: news.length, review: news.filter((n) => n.status === "review").length },
  ];

  const profileState = !team
    ? "Not linked yet - ask an AILO admin to link your team profile."
    : team.pendingSince
      ? "Changes waiting for admin approval."
      : team.isActive
        ? "Live on the public team page."
        : "Not published yet - fill it in and an admin will publish it.";

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Welcome, {session.name.split(" ")[0]}</h1>
          <p>Manage your research, projects, news drafts and team profile. Everything you submit is reviewed by an AILO admin before it goes live.</p>
        </div>
      </div>

      <div className="dash-grid" style={{ marginBottom: 20 }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={`dash-card dash-${c.accent}${c.review ? " attention" : ""}`}>
            <span className="dash-label">{c.label}</span>
            <span className="dash-value">{c.total}</span>
            <span style={{ fontSize: 13, color: "#5b6664" }}>{c.review ? `${c.review} waiting for review` : "Nothing waiting for review"}</span>
          </Link>
        ))}
        <Link href="/dosen/profile" className={`dash-card dash-team${team?.pendingSince ? " attention" : ""}`}>
          <span className="dash-label">My profile</span>
          <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: "#15201f" }}>{profileState}</span>
        </Link>
      </div>

      <section className="admin2-section pad-sm" style={{ maxWidth: 760 }}>
        <h2>How it works</h2>
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, lineHeight: 1.55, color: "#3b4947" }}>
          <li>Add or edit your research, projects or a news draft. It&apos;s saved as <strong>In review</strong>.</li>
          <li>An AILO admin checks it and publishes it (they may make small edits).</li>
          <li>Once published it appears on the public site and is locked here; ask an admin for later changes.</li>
        </ol>
      </section>
    </div>
  );
}
