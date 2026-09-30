"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { PasswordInput } from "@/components/PasswordInput";
import { safeNextPath } from "@/lib/safeRedirect";

/** Sign-in for the only account holders: AILO lecturers (dosen) and admins. */
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
      const role = json.data?.role;
      const home = ["super_admin", "admin", "staff_lab"].includes(role) ? "/admin/dashboard" : role === "dosen" ? "/dosen" : "/";
      // Hard navigation avoids a stale router-cache 404 right after the
      // session cookie changes (see AdminLoginForm for the same fix).
      window.location.href = safeNextPath(searchParams.get("next"), home);
    } catch {
      setError("Network error, please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">
            <Image src="/logo-mark.png" alt="AILO" width={30} height={30} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
          </span>
          <span className="auth-brand-name">AILO</span>
        </Link>
        <div className="auth-heading">
          <h1>Sign in</h1>
          <p>For AILO lecturers and admins. Members and visitors don&apos;t need an account - lab bookings use your member card number.</p>
        </div>
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
          <button type="submit" className="admin2-btn" style={{ height: 48, justifyContent: "center" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link href="/" className="auth-back">
          Back to site
        </Link>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
