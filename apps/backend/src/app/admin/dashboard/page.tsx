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

  const cards = [
    { label: "News articles", value: newsCount, href: "/admin/news" },
    { label: "Pending bookings", value: pendingBookings, href: "/admin/bookings?status=pending", warn: pendingBookings > 0 },
    { label: "Pending members", value: pendingMembers, href: "/admin/members?status=pending", warn: pendingMembers > 0 },
    { label: "Unread messages", value: unreadMessages, href: "/admin/messages?tab=unread", warn: unreadMessages > 0 },
    { label: "Projects", value: projectCount, href: "/admin/projects" },
    { label: "Research areas", value: researchCount, href: "/admin/research" },
    { label: "Team members", value: teamCount, href: "/admin/team" },
    { label: "Labs", value: labCount, href: "/admin/labs" },
  ];

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of what needs attention across the site.</p>
        </div>
      </div>

      <div className="admin2-stat-grid">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`admin2-stat-card${c.warn ? " warn" : ""}`} style={{ textDecoration: "none" }}>
            <span>{c.label}</span>
            <span>{c.value}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
