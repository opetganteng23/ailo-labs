"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { PasswordInput } from "@/components/PasswordInput";
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
      const isAdmin = ["super_admin", "admin", "staff_lab"].includes(json.data?.role);
      // Hard navigation avoids a stale router-cache 404 right after the
      // session cookie changes (see AdminLoginForm for the same fix).
      window.location.href = safeNextPath(searchParams.get("next"), isAdmin ? "/admin/dashboard" : "/");
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
            WELCOME BACK
          </span>
          <h1 style={{ position: "relative", margin: "14px 0 0", fontSize: 34, fontWeight: 800, lineHeight: 1.15, maxWidth: "16ch" }}>
            Book AILO labs and devices in minutes.
          </h1>
          <p style={{ position: "relative", marginTop: 16, fontSize: 15.5, lineHeight: 1.6, color: "#c9dcdc", maxWidth: "34ch" }}>
            Sign in to submit a request, track its status, and get notified the moment a lab admin responds.
          </p>
          <ul className="auth-split-list">
            <li>Reserve a whole lab or a single device</li>
            <li>See live availability before you request</li>
            <li>Get email updates on every decision</li>
          </ul>
        </div>

        <div className="auth-split-form">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Sign in</h2>
          <p style={{ margin: "6px 0 28px", fontSize: 14.5, color: "#5b6664" }}>
            Don&apos;t have an account yet?{" "}
            <Link href="/register" style={{ color: "var(--teal-dark)", fontWeight: 700 }}>
              Register here
            </Link>
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="admin2-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoFocus autoComplete="username" />
            </div>
            <div className="admin2-field">
              <label htmlFor="password" className="label-row">
                Password
                <Link href="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </label>
              <PasswordInput id="password" name="password" required autoComplete="current-password" />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary" style={{ justifyContent: "center", width: "100%" }} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
