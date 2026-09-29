import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Lab } from "@/models/Lab";

import { reviewBookingAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "pending", "approved", "completed", "rejected", "cancelled"] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; lab?: string; from?: string }>;
}) {
  const { status, lab, from } = await searchParams;
  const currentStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? (status as (typeof STATUSES)[number]) : "all";

  await connectToDatabase();

  const labs = (await Lab.find().sort({ name: 1 }).lean()) as unknown as { _id: string; name: string }[];

  const filter: Record<string, unknown> = {};
  if (currentStatus !== "all") filter.status = currentStatus;
  if (lab) filter.lab = lab;
  if (from) filter.startDateTime = { $gte: new Date(from) };

  const [items, allForCounts] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).populate("lab", "name").populate("device", "name").lean() as unknown as Promise<
      {
        _id: string;
        borrowerName: string;
        borrowerEmail: string;
        status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
        startDateTime: string;
        endDateTime: string;
        lab?: { name?: string };
        device?: { name?: string };
      }[]
    >,
    Booking.find().lean() as unknown as Promise<{ status: string }[]>,
  ]);

  const counts = {
    pending: allForCounts.filter((b) => b.status === "pending").length,
    approved: allForCounts.filter((b) => b.status === "approved").length,
    completed: allForCounts.filter((b) => b.status === "completed").length,
    rejectedOrCancelled: allForCounts.filter((b) => b.status === "rejected" || b.status === "cancelled").length,
  };

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Bookings</h1>
          <p>Approve or reject lab and device requests from visitors.</p>
        </div>
        <div className="admin2-actions">
          <a href={`/api/admin/bookings/export?status=${currentStatus}`} className="admin2-btn outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
            </svg>
            Export CSV
          </a>
        </div>
      </div>

      <div className="admin2-stat-grid">
        <div className="admin2-stat-card">
          <span>Waiting for approval</span>
          <span>{counts.pending}</span>
        </div>
        <div className="admin2-stat-card">
          <span>Upcoming (approved)</span>
          <span>{counts.approved}</span>
        </div>
        <div className="admin2-stat-card">
          <span>Completed</span>
          <span>{counts.completed}</span>
        </div>
        <div className="admin2-stat-card">
          <span>Rejected / cancelled</span>
          <span>{counts.rejectedOrCancelled}</span>
        </div>
      </div>

      <section className="admin2-panel" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <form className="admin2-panel-toolbar">
          <div className="admin2-tabs">
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={`/admin/bookings?status=${s}${lab ? `&lab=${lab}` : ""}${from ? `&from=${from}` : ""}`}
                className={`admin2-tab${currentStatus === s ? " active" : ""}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            ))}
          </div>
          <input type="hidden" name="status" value={currentStatus} />
          <select name="lab" aria-label="Lab" className="admin2-select" defaultValue={lab ?? ""} style={{ marginLeft: "auto" }}>
            <option value="">All labs</option>
            {labs.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
          <input type="date" name="from" aria-label="From date" defaultValue={from} className="admin2-select" style={{ width: 150 }} />
          <button type="submit" className="admin2-btn outline">
            Apply
          </button>
        </form>

        <div className="admin2-table-head" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr) 130px 200px" }}>
          <span>BORROWER</span>
          <span>LAB</span>
          <span>DEVICE</span>
          <span>WINDOW</span>
          <span>STATUS</span>
          <span></span>
        </div>

        {items.length === 0 ? (
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 40, textAlign: "center" }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, background: "#e3f1f1", color: "#0e6b73", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="14" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            </span>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>No booking requests {currentStatus === "all" ? "yet" : `with status "${currentStatus}"`}</h2>
            <p style={{ margin: 0, maxWidth: 420, fontSize: 14, lineHeight: 1.55, color: "#5b6664" }}>
              When someone books a lab or device on the public site, the request lands here with Approve and Reject buttons.
            </p>
            <Link href="/admin/labs" style={{ fontSize: 14, fontWeight: 700 }}>
              Check lab details
            </Link>
          </div>
        ) : (
          items.map((b) => (
            <div key={b._id} className="admin2-table-row" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr) 130px 200px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700 }}>{b.borrowerName}</span>
                <span style={{ fontSize: 13, color: "#6b7573" }}>{b.borrowerEmail}</span>
              </div>
              <span>{b.lab?.name ?? "-"}</span>
              <span>{b.device?.name ?? "-"}</span>
              <span style={{ fontSize: 13 }}>
                {new Date(b.startDateTime).toLocaleString("en-GB")} - {new Date(b.endDateTime).toLocaleString("en-GB")}
              </span>
              <span className={`admin2-pill ${b.status}`}>
                <span className="dot" />
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
              <div>
                {b.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <form action={reviewBookingAction}>
                      <input type="hidden" name="id" value={b._id} />
                      <input type="hidden" name="status" value="approved" />
                      <button type="submit" className="admin2-btn" style={{ height: 36, padding: "0 12px", fontSize: 13 }}>
                        Approve
                      </button>
                    </form>
                    <form action={reviewBookingAction}>
                      <input type="hidden" name="id" value={b._id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button type="submit" className="admin2-btn danger" style={{ height: 36, padding: "0 12px", fontSize: 13 }}>
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
