import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Lab } from "@/models/Lab";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connectToDatabase();
  const [newsCount, pendingBookings, projectCount, researchCount, teamCount, labCount] = await Promise.all([
    News.countDocuments(),
    Booking.countDocuments({ status: "pending" }),
    Project.countDocuments(),
    Research.countDocuments(),
    Team.countDocuments(),
    Lab.countDocuments(),
  ]);

  const cards = [
    { label: "News articles", value: newsCount },
    { label: "Pending bookings", value: pendingBookings },
    { label: "Projects", value: projectCount },
    { label: "Research areas", value: researchCount },
    { label: "Team members", value: teamCount },
    { label: "Labs", value: labCount },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stat-cards" style={{ marginTop: 24 }}>
        {cards.map((c) => (
          <div className="card" key={c.label}>
            <div className="n">{c.value}</div>
            <div className="l">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
