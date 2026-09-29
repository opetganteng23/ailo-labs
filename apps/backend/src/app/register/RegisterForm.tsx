"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { PasswordInput } from "@/components/PasswordInput";
import { safeNextPath } from "@/lib/safeRedirect";

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          phone: form.get("phone"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      // Hard navigation avoids a stale router-cache 404 right after the
      // session cookie changes (see AdminLoginForm for the same fix).
      window.location.href = safeNextPath(searchParams.get("next"), "/");
    } catch {
      setError("Network error, please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 72 }}>
      <div className="auth-split">
        <div className="auth-split-panel">
          <div className="auth-split-ring" />
          <span className="kicker-sm" style={{ color: "#f7b77f", position: "relative" }}>
            GET STARTED
          </span>
          <h1 style={{ position: "relative", margin: "14px 0 0", fontSize: 34, fontWeight: 800, lineHeight: 1.15, maxWidth: "16ch" }}>
            Create an account to borrow AILO labs.
          </h1>
          <p style={{ position: "relative", marginTop: 16, fontSize: 15.5, lineHeight: 1.6, color: "#c9dcdc", maxWidth: "34ch" }}>
            One account gets you booking requests for every AILO lab and device, no per-lab sign-up.
          </p>
          <ul className="auth-split-list">
            <li>Free, takes under a minute</li>
            <li>Your details autofill every booking</li>
            <li>Track requests from one place</li>
          </ul>
        </div>

        <div className="auth-split-form">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Create account</h2>
          <p style={{ margin: "6px 0 28px", fontSize: 14.5, color: "#5b6664" }}>
            Already have one?{" "}
            <Link href="/login" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>
              Sign in here
            </Link>
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="admin2-field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" required maxLength={160} autoFocus />
            </div>
            <div className="admin2-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" />
            </div>
            <div className="admin2-field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" required />
            </div>
            <div className="admin2-field">
              <label htmlFor="password">Password</label>
              <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary" style={{ justifyContent: "center", width: "100%" }} disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={null}>
      <RegisterFormInner />
    </Suspense>
  );
}
