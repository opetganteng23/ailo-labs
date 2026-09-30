import Image from "next/image";
import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";
import { Lab } from "@/models/Lab";
import { Member } from "@/models/Member";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking pass · AILO", robots: { index: false } };

type PassBooking = {
  borrowerName: string;
  memberCardId?: string;
  status: string;
  startDateTime: Date;
  endDateTime: Date;
  lab?: { name?: string; location?: string };
  device?: { name?: string };
  member?: { photo?: string; approvedAs?: string; requestedAs?: string };
};

const fmt = (d: Date) =>
  new Date(d).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Opened by scanning the QR in the approval email. Lab staff check the big
 * status: the pass is only valid between the booked start and end time.
 */
export default async function BookingPassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!code || code.length < 16) notFound();

  await connectToDatabase();
  // Referenced models must be registered before populate.
  void Lab;
  void Device;
  void Member;
  const booking = await Booking.findOne({ accessCode: code })
    .populate("lab", "name location")
    .populate("device", "name")
    .populate("member", "photo approvedAs requestedAs")
    .lean<PassBooking>();
  if (!booking) notFound();

  const now = new Date();
  const start = new Date(booking.startDateTime);
  const end = new Date(booking.endDateTime);
  const state =
    booking.status !== "approved" && booking.status !== "completed"
      ? { key: "invalid", title: "Not valid", sub: `This booking is ${booking.status}.` }
      : now < start
        ? { key: "early", title: "Not started yet", sub: `Valid from ${fmt(start)} WIB.` }
        : now > end
          ? { key: "expired", title: "Expired", sub: `Ended ${fmt(end)} WIB.` }
          : { key: "valid", title: "Valid now", sub: `Until ${fmt(end)} WIB.` };

  const what = booking.device?.name ? `${booking.device.name} · ${booking.lab?.name ?? ""}` : booking.lab?.name ?? "AILO lab";

  return (
    <main className="pass-shell">
      <div className="pass-card">
        <div className="pass-brand">
          <span className="pass-mark">
            <Image src="/logo-square.png" alt="AILO" width={26} height={26} />
          </span>
          <span>
            <strong>AILO lab access</strong>
            <small>Booking pass</small>
          </span>
        </div>

        <div className={`pass-status pass-${state.key}`} role="status">
          <span className="pass-status-title">{state.title}</span>
          <span className="pass-status-sub">{state.sub}</span>
        </div>

        <div className="pass-person">
          {booking.member?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- member photo from uploads
            <img src={booking.member.photo} alt={booking.borrowerName} />
          ) : (
            <span className="pass-avatar">{booking.borrowerName.charAt(0).toUpperCase()}</span>
          )}
          <span>
            <strong>{booking.borrowerName}</strong>
            <small>{booking.memberCardId ?? "No member card"}</small>
            {(booking.member?.approvedAs || booking.member?.requestedAs) && <small>{booking.member.approvedAs ?? booking.member.requestedAs}</small>}
          </span>
        </div>

        <dl className="pass-details">
          <dt>Booked</dt>
          <dd>{what}</dd>
          {booking.lab?.location && (
            <>
              <dt>Location</dt>
              <dd>{booking.lab.location}</dd>
            </>
          )}
          <dt>From</dt>
          <dd>{fmt(start)} WIB</dd>
          <dt>Until</dt>
          <dd>{fmt(end)} WIB</dd>
        </dl>
        <p className="pass-foot">Staff: check the photo matches the person and the status says &quot;Valid now&quot;.</p>
      </div>
    </main>
  );
}
