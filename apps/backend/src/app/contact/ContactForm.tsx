"use client";

import Link from "next/link";
import { useState } from "react";

const SENT_KEY = "ailo_contact_sent";

function readSent(): string {
  try {
    return sessionStorage.getItem(SENT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ContactForm() {
  // One-time message (§4): once sent, this browser tab keeps showing the confirmation,
  // read lazily on mount instead of via an effect so there's no extra render.
  const [sentTo, setSentTo] = useState(readSent);
  const [state, setState] = useState<"idle" | "sending" | "sent">(() => (readSent() ? "sent" : "idle"));
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
          website: form.get("website"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Your message couldn't be sent. Please try again.");
        setState("idle");
        return;
      }
      const email = String(form.get("email") ?? "");
      setSentTo(email);
      try {
        sessionStorage.setItem(SENT_KEY, email);
      } catch {
        // ignore
      }
      setState("sent");
    } catch {
      setError("Network error, please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="contact-card contact-sent" role="status">
        <span className="contact-sent-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <h2>Pesan berhasil terkirim</h2>
        <p>
          Pesan Anda sudah berhasil dikirim. Silakan cek email Anda{sentTo ? ` (${sentTo})` : ""} untuk melihat balasan dari tim kami.
        </p>
        <Link href="/" className="btn-primary">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  return (
    <form className="contact-card" onSubmit={handleSubmit}>
      <div className="contact-grid">
        <div className="admin2-field">
          <label htmlFor="c-name">
            Name<span className="req">*</span>
          </label>
          <input id="c-name" name="name" type="text" required minLength={2} maxLength={120} autoComplete="name" />
        </div>
        <div className="admin2-field">
          <label htmlFor="c-email">
            Email<span className="req">*</span>
          </label>
          <input id="c-email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="admin2-field">
        <label htmlFor="c-subject">
          Subject<span className="req">*</span>
        </label>
        <input id="c-subject" name="subject" type="text" required minLength={2} maxLength={160} placeholder="Research collaboration, lab visit, media…" />
      </div>
      <div className="admin2-field">
        <label htmlFor="c-message">
          Message<span className="req">*</span>
        </label>
        <textarea id="c-message" name="message" required minLength={10} maxLength={5000} rows={6} />
      </div>
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="contact-hp" />
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start" }} disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
