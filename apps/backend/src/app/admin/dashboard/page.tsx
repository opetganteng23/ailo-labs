import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ContactMessage } from "@/models/ContactMessage";
import { Lab } from "@/models/Lab";
import { Member } from "@/models/Member";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

const ICONS = {
  news: "M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M8 9h5M8 13h5M8 17h3",
  bookings: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4",
  members: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 16.5a3 3 0 0 1 6 0M14 10h4M14 14h3",
  messages: "M4 5h16v11H8l-4 4z",
  projects: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  research: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3",
  team: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6",
  labs: "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 20h8M12 16v4",
};

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const [newsCount, pendingBookings, projectCount, researchCount, teamCount, labCount, pendingMembers, unreadMessages] = await Promise.all([
    News.countDocuments(),
    Booking.countDocuments({ status: "pending" }),
    Project.countDocuments(),
    Research.countDocuments(),
    Team.countDocuments(),
    Lab.countDocuments(),
    Member.countDocuments({ status: "pending" }),
    ContactMessage.countDocuments({ isRead: false, archived: false }),
  ]);
  // Lecturer submissions waiting for an admin (dosen dashboard).
  const [researchReview, projectReview, newsReview, profileReview] = await Promise.all([
    Research.countDocuments({ status: "review" }),
    Project.countDocuments({ publishStatus: "review" }),
    News.countDocuments({ status: "review" }),
    Team.countDocuments({ pendingSince: { $exists: true, $ne: null } }),
  ]);
  const reviewItems = [
    { label: "Research", n: researchReview, href: "/admin/research?status=review" },
    { label: "Projects", n: projectReview, href: "/admin/projects" },
    { label: "News", n: newsReview, href: "/admin/news?status=review" },
    { label: "Team profiles", n: profileReview, href: "/admin/team" },
  ].filter((r) => r.n > 0);

  // Each kind of card has its own accent from the AILO palette so it can be
  // recognised at a glance (QA UMUM-03).
  const cards = [
    { label: "News articles", value: newsCount, href: "/admin/news", accent: "news", icon: ICONS.news },
    { label: "Pending bookings", value: pendingBookings, href: "/admin/bookings?status=pending", accent: "bookings", icon: ICONS.bookings, warn: pendingBookings > 0 },
    { label: "Pending members", value: pendingMembers, href: "/admin/members?status=pending", accent: "members", icon: ICONS.members, warn: pendingMembers > 0 },
    { label: "New messages", value: unreadMessages, href: "/admin/messages?tab=new", accent: "messages", icon: ICONS.messages, warn: unreadMessages > 0 },
    { label: "Projects", value: projectCount, href: "/admin/projects", accent: "projects", icon: ICONS.projects },
    { label: "Research areas", value: researchCount, href: "/admin/research", accent: "research", icon: ICONS.research },
    { label: "Team members", value: teamCount, href: "/admin/team", accent: "team", icon: ICONS.team },
    { label: "Labs", value: labCount, href: "/admin/labs", accent: "labs", icon: ICONS.labs },
  ];

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of what needs attention across the site.</p>
        </div>
      </div>

      {reviewItems.length > 0 && (
        <section className="admin2-banner" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
            <strong>Waiting for your review</strong>
            <span className="sub">Submitted by lecturers from their dashboard.</span>
          </div>
          <div className="admin2-banner-steps">
            {reviewItems.map((r) => (
              <Link key={r.label} href={r.href} style={{ color: "inherit", fontWeight: 700 }}>
                {r.label} · {r.n}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="dash-grid">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`dash-card dash-${c.accent}${c.warn ? " attention" : ""}`}>
            <span className="dash-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.icon} />
              </svg>
            </span>
            <span className="dash-label">{c.label}</span>
            <span className="dash-value">{c.value}</span>
            {c.warn && <span className="dash-flag">Needs attention</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
