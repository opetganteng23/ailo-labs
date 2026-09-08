"use client";

import { useState } from "react";

type Device = { _id: string; name: string };

export function BookingForm({
  labId,
  devices,
  defaultName,
  defaultEmail,
}: {
  labId: string;
  devices: Device[];
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      borrowerName: form.get("borrowerName"),
      borrowerEmail: form.get("borrowerEmail"),
      borrowerPhone: form.get("borrowerPhone"),
      institution: form.get("institution"),
      lab: labId,
      device: form.get("device") || undefined,
      purpose: form.get("purpose"),
      startDateTime: form.get("startDateTime"),
      endDateTime: form.get("endDateTime"),
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        setMessage(json.error ?? "Unable to submit booking.");
        return;
      }
      setStatus("success");
      setMessage("Booking request submitted. Check your email for confirmation.");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage("Network error, please try again.");
    }
  }

  if (status === "success") {
    return <p className="notice">{message}</p>;
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label>
        Full name
        <input name="borrowerName" required maxLength={160} defaultValue={defaultName} />
      </label>
      <label>
        Email
        <input name="borrowerEmail" type="email" required defaultValue={defaultEmail} />
      </label>
      <label>
        Phone
        <input name="borrowerPhone" required />
      </label>
      <label>
        Institution
        <input name="institution" required />
      </label>
      {devices.length > 0 && (
        <label>
          Device (optional)
          <select name="device" defaultValue="">
            <option value="">Whole lab / no specific device</option>
            {devices.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Start
        <input name="startDateTime" type="datetime-local" required />
      </label>
      <label>
        End
        <input name="endDateTime" type="datetime-local" required />
      </label>
      <label>
        Purpose
        <textarea name="purpose" required minLength={5} />
      </label>
      {status === "error" && <p className="error-text">{message}</p>}
      <button type="submit" className="btn" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit booking request"}
      </button>
    </form>
  );
}
