"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";

type Device = { _id: string; name: string };
type ApiBooking = { startDateTime: string; endDateTime: string; status: "pending" | "approved"; device: string | null };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const START_HOUR = 8;
const SLOT_COUNT = 9; // 08:00 - 17:00

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function BookingForm({
  labId,
  labSlug,
  labName,
  devices,
}: {
  labId: string;
  labSlug: string;
  labName: string;
  devices: Device[];
}) {
  const [mode, setMode] = useState<"room" | "device">(devices.length > 0 ? "room" : "room");
  const [deviceId, setDeviceId] = useState<string>("");
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cardId, setCardId] = useState("");
  const [people, setPeople] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [letter, setLetter] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/labs/${labSlug}/availability?month=${monthKey(cursor)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setBookings(json.data);
      });
    return () => {
      cancelled = true;
    };
  }, [labSlug, cursor]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first

  const relevantBookings = useMemo(
    () => bookings.filter((b) => (mode === "device" && deviceId ? b.device === deviceId : true)),
    [bookings, mode, deviceId],
  );

  function dayBookings(day: number) {
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59);
    return relevantBookings.filter((b) => new Date(b.startDateTime) < dayEnd && new Date(b.endDateTime) > dayStart && b.status === "approved");
  }

  function isDayFull(day: number): boolean {
    const covered = new Set<number>();
    for (const b of dayBookings(day)) {
      const start = new Date(b.startDateTime);
      const end = new Date(b.endDateTime);
      for (let h = START_HOUR; h < START_HOUR + SLOT_COUNT; h++) {
        const slotStart = new Date(year, month, day, h);
        const slotEnd = new Date(year, month, day, h + 1);
        if (start < slotEnd && end > slotStart) covered.add(h);
      }
    }
    return covered.size >= SLOT_COUNT;
  }

  function isPast(day: number): boolean {
    // The day is over once its last bookable slot has started.
    const lastSlot = new Date(year, month, day, START_HOUR + SLOT_COUNT - 1);
    return lastSlot <= new Date();
  }

  function slotBooked(day: number, hourOffset: number): boolean {
    const hour = START_HOUR + hourOffset;
    const slotStart = new Date(year, month, day, hour);
    const slotEnd = new Date(year, month, day, hour + 1);
    return dayBookings(day).some((b) => new Date(b.startDateTime) < slotEnd && new Date(b.endDateTime) > slotStart);
  }

  function pickDay(day: number) {
    setSelectedDay(new Date(year, month, day));
    setSelectedSlots([]);
  }

  function toggleSlot(i: number) {
    setSelectedSlots((prev) => (prev.includes(i) ? prev.filter((s) => s !== i) : [...prev, i].sort((a, b) => a - b)));
  }

  const timeLabel =
    selectedSlots.length > 0
      ? `${String(START_HOUR + selectedSlots[0]).padStart(2, "0")}:00 - ${String(START_HOUR + selectedSlots[selectedSlots.length - 1] + 1).padStart(2, "0")}:00`
      : "Pick a time";

  const canSubmit = !!(
    selectedDay &&
    selectedSlots.length > 0 &&
    name.trim() &&
    email.trim() &&
    phone.trim().length >= 8 &&
    cardId.trim().length >= 4 &&
    purpose.trim().length >= 5 &&
    agreeRules
  );

  async function submit() {
    if (!selectedDay || selectedSlots.length === 0) return;
    setStatus("submitting");
    setError("");

    const startDateTime = new Date(selectedDay);
    startDateTime.setHours(START_HOUR + selectedSlots[0], 0, 0, 0);
    const endDateTime = new Date(selectedDay);
    endDateTime.setHours(START_HOUR + selectedSlots[selectedSlots.length - 1] + 1, 0, 0, 0);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerName: name,
          borrowerEmail: email,
          borrowerPhone: phone,
          memberCardId: cardId,
          lab: labId,
          device: mode === "device" && deviceId ? deviceId : undefined,
          purpose: `${purpose}${people && people !== "1" ? ` (${people} people)` : ""}${letter ? `\nRequest letter: ${letter}` : ""}`,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        setError(json.error ?? "Unable to submit booking.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Network error, please try again.");
    }
  }

  if (status === "success") {
    return (
      <section className="join-panel" style={{ maxWidth: 640, margin: "0 auto", padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
        <span style={{ width: 72, height: 72, borderRadius: 999, background: "#dcf1e4", color: "#17603a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Request sent</h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4e5957" }}>
          {labName} · {selectedDay?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {timeLabel}. When the lab admin approves it, you&apos;ll get an email at {email} with a QR code to show at the lab. The QR only works during your booked time.
        </p>
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <Link href="/" className="join-btn join-btn-dark">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="join-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
        {devices.length > 0 && (
          <section className="join-panel" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="booking-step-n">1</span>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, flexGrow: 1 }}>What do you want to book?</h2>
              <div style={{ display: "flex", padding: 4, background: "#f1efea", borderRadius: 11, gap: 2 }}>
                <button type="button" className={`booking-seg${mode === "room" ? " active" : ""}`} onClick={() => setMode("room")}>
                  Whole lab
                </button>
                <button type="button" className={`booking-seg${mode === "device" ? " active" : ""}`} onClick={() => setMode("device")}>
                  A device
                </button>
              </div>
            </div>
            {mode === "device" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, borderRadius: 14, background: "#f2f8f8", border: "1px solid #d7e7e7" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Devices in {labName}</span>
                {devices.map((d) => (
                  <label key={d._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11, background: "#fff", border: "1px solid #dad7cf", cursor: "pointer" }}>
                    <input type="radio" name="device" checked={deviceId === d._id} onChange={() => setDeviceId(d._id)} style={{ width: 18, height: 18, accentColor: "#0e6b73" }} />
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{d.name}</span>
                  </label>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="join-panel" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="booking-step-n">{devices.length > 0 ? 2 : 1}</span>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Pick a date and time</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button type="button" aria-label="Previous month" className="booking-nav-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}>
                  ‹
                </button>
                <span style={{ flexGrow: 1, textAlign: "center", fontSize: 16, fontWeight: 800 }}>
                  {MONTH_NAMES[month]} {year}
                </span>
                <button type="button" aria-label="Next month" className="booking-nav-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}>
                  ›
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, fontSize: 12, fontWeight: 700, color: "#6b7573", textAlign: "center" }}>
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
                {Array.from({ length: firstWeekday }, (_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateObj = new Date(year, month, day);
                  const sel = selectedDay && isSameDay(selectedDay, dateObj);
                  const past = isPast(day);
                  const full = isDayFull(day);
                  const disabled = past || full;
                  let cls = "booking-day";
                  if (sel) cls += " selected";
                  else if (full) cls += " full";
                  else if (past) cls += " past";
                  return (
                    <button key={day} type="button" className={cls} disabled={disabled} onClick={() => pickDay(day)}>
                      {day}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#5b6664", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="booking-legend-dot" style={{ background: "#0a3f46" }} />
                  Selected
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="booking-legend-dot" style={{ background: "#fbddbd" }} />
                  Fully booked
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>
                {selectedDay ? selectedDay.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Pick a day first"}
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                {Array.from({ length: SLOT_COUNT }, (_, i) => {
                  const hour = START_HOUR + i;
                  const booked = selectedDay ? slotBooked(selectedDay.getDate(), i) : false;
                  // Today's slots that already started can't be booked.
                  const gone = selectedDay ? new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), hour) <= new Date() : false;
                  const on = selectedSlots.includes(i);
                  let cls = "booking-slot";
                  if (booked || gone) cls += " booked";
                  else if (on) cls += " selected";
                  return (
                    <button key={i} type="button" className={cls} disabled={!selectedDay || booked || gone} onClick={() => toggleSlot(i)}>
                      {String(hour).padStart(2, "0")}:00
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "#6b7573" }}>Tap several slots for a longer session. Grey slots are already booked.</span>
            </div>
          </div>
        </section>

        <section className="join-panel" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="booking-step-n">{devices.length > 0 ? 3 : 2}</span>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Your details</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div className="join-field">
              <label htmlFor="bname">
                Full name<span className="req">*</span>
              </label>
              <input id="bname" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="join-field">
              <label htmlFor="bcard">
                Member card number<span className="req">*</span>
              </label>
              <input id="bcard" type="text" placeholder="AILO-2026-0001" value={cardId} onChange={(e) => setCardId(e.target.value.toUpperCase())} required />
            </div>
            <div className="join-field">
              <label htmlFor="bemail">
                Email<span className="req">*</span> <span style={{ fontWeight: 500, color: "#6b7573" }}>- the one on your member card</span>
              </label>
              <input id="bemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="join-field">
              <label htmlFor="bwa">
                WhatsApp<span className="req">*</span>
              </label>
              <input id="bwa" type="tel" placeholder="+62 8…" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="join-field">
              <label htmlFor="bppl">Number of people</label>
              <input id="bppl" type="text" value={people} onChange={(e) => setPeople(e.target.value)} />
            </div>
          </div>
          <div className="join-field">
            <label htmlFor="bpurpose">
              Purpose<span className="req">*</span>
            </label>
            <textarea id="bpurpose" rows={3} placeholder="e.g. Training a vision model for my thesis" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
          </div>
          <div className="join-field">
            <label>
              Request letter <span style={{ fontWeight: 500, color: "#6b7573" }}>(optional)</span>
            </label>
            <ImageUploadField name="letter" label="" accept="image/png,image/jpeg,application/pdf" defaultValue={letter} onChangeUrl={setLetter} />
          </div>
        </section>
      </div>

      <aside className="join-aside">
        <div className="join-panel">
          <div style={{ padding: "22px 24px", background: "#0a3f46", color: "#fff", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#9dc0c1" }}>YOUR REQUEST</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{labName}</span>
            <span style={{ fontSize: 14, color: "#c9dcdc" }}>{mode === "room" ? "Whole lab" : "Device booking"}</span>
          </div>
          <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "100px minmax(0, 1fr)", gap: 12, fontSize: 15 }}>
            <span style={{ color: "#6b7573" }}>Date</span>
            <span style={{ fontWeight: 700 }}>{selectedDay ? selectedDay.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—"}</span>
            <span style={{ color: "#6b7573" }}>Time</span>
            <span style={{ fontWeight: 700 }}>{timeLabel}</span>
            <span style={{ color: "#6b7573" }}>Duration</span>
            <span style={{ fontWeight: 700 }}>{selectedSlots.length ? `${selectedSlots.length} hour${selectedSlots.length > 1 ? "s" : ""}` : "—"}</span>
          </div>
          <div style={{ margin: "0 24px 22px", padding: 14, borderRadius: 12, background: "#f7f5f0", display: "flex", gap: 10, fontSize: 13, lineHeight: 1.5, color: "#4e5957" }}>
            <svg style={{ flexShrink: 0, marginTop: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M11 12h1v5h1" />
            </svg>
            <span>Not confirmed yet. Once the lab admin approves, you&apos;ll get an email with a QR code to enter the lab. It&apos;s only valid during the time you booked.</span>
          </div>
          <div style={{ padding: "0 24px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
              <input type="checkbox" checked={agreeRules} onChange={(e) => setAgreeRules(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2 }} />
              I&apos;ve read the lab rules.
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="button" className="join-btn join-btn-orange" style={{ justifyContent: "center" }} disabled={!canSubmit || status === "submitting"} onClick={submit}>
              {status === "submitting" ? "Sending…" : "Send booking request"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
