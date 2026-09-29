"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { safeNextPath } from "@/lib/safeRedirect";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      // Hard navigation: a client-side router.push right after the session
      // cookie is set can race with Next's router cache and briefly render
      // a stale not-found for the target route. A full navigation always
      // picks up the new cookie cleanly.
      window.location.href = safeNextPath(searchParams.get("next"), "/admin/dashboard");
    } catch {
      setError("Network error - please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">
            <Image src="/logo-square.png" alt="AILO" width={40} height={40} />
          </span>
          <span className="auth-brand-name">AILO</span>
        </Link>
        <div className="auth-heading">
          <h1>Admin console</h1>
          <p>Sign in to manage content, bookings, members and settings.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="admin2-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoFocus autoComplete="username" />
          </div>
          <div className="admin2-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="admin2-btn" style={{ height: 48, justifyContent: "center" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link href="/" className="auth-back">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

export function AdminLoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
