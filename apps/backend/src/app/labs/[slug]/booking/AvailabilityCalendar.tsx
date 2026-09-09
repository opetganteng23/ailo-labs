"use client";

import { useEffect, useState } from "react";

type Booking = { startDateTime: string; endDateTime: string; status: "pending" | "approved" };
type DayStatus = "available" | "pending" | "booked";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function AvailabilityCalendar({ labSlug }: { labSlug: string }) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for an effect-driven fetch, standard pattern
    setLoading(true);
    fetch(`/api/labs/${labSlug}/availability?month=${monthKey(cursor)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setBookings(json.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [labSlug, cursor]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  function statusForDay(day: number): DayStatus {
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59);
    let hasPending = false;
    for (const b of bookings) {
      const start = new Date(b.startDateTime);
      const end = new Date(b.endDateTime);
      if (start < dayEnd && end > dayStart) {
        if (b.status === "approved") return "booked";
        hasPending = true;
      }
    }
    return hasPending ? "pending" : "available";
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="availability-cal">
      <div className="availability-cal-head">
        <button type="button" className="btn outline" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          &lt;
        </button>
        <strong>
          {MONTH_NAMES[month]} {year}
        </strong>
        <button type="button" className="btn outline" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          &gt;
        </button>
      </div>

      <div className="availability-cal-legend">
        <span><i className="dot available" /> Tersedia</span>
        <span><i className="dot pending" /> Menunggu persetujuan</span>
        <span><i className="dot booked" /> Penuh</span>
      </div>

      <div className="availability-cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="availability-cal-weekday">
            {w}
          </div>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} className="availability-cal-day empty" />
          ) : (
            <div key={day} className={`availability-cal-day ${loading ? "loading" : statusForDay(day)}`}>
              {day}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
