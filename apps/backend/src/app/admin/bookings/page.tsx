import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";

import { reviewBookingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  await connectToDatabase();
  const filter = status && status !== "all" ? { status } : {};
  const items = (await Booking.find(filter)
    .sort({ createdAt: -1 })
    .populate("lab", "name")
    .populate("device", "name")
    .lean()) as unknown as {
    _id: string;
    borrowerName: string;
    borrowerEmail: string;
    status: string;
    startDateTime: string;
    endDateTime: string;
    lab?: { name?: string };
    device?: { name?: string };
  }[];

  const filters = ["all", "pending", "approved", "rejected", "completed", "cancelled"];

  return (
    <div>
      <h1>Bookings</h1>
      <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
        {filters.map((f) => (
          <a key={f} href={`/admin/bookings?status=${f}`} className="btn outline">
            {f}
          </a>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Borrower</th>
            <th>Lab</th>
            <th>Device</th>
            <th>Window</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b._id}>
              <td>
                {b.borrowerName}
                <br />
                <small>{b.borrowerEmail}</small>
              </td>
              <td>{b.lab?.name ?? "-"}</td>
              <td>{b.device?.name ?? "-"}</td>
              <td>
                {new Date(b.startDateTime).toLocaleString()} to {new Date(b.endDateTime).toLocaleString()}
              </td>
              <td>
                <span className={`badge ${b.status}`}>{b.status}</span>
              </td>
              <td>
                {b.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <form action={reviewBookingAction}>
                      <input type="hidden" name="id" value={b._id} />
                      <input type="hidden" name="status" value="approved" />
                      <button type="submit" className="btn">
                        Approve
                      </button>
                    </form>
                    <form action={reviewBookingAction}>
                      <input type="hidden" name="id" value={b._id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button type="submit" className="btn danger">
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
