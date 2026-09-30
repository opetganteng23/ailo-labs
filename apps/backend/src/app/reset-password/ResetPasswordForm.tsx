"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PasswordInput } from "@/components/PasswordInput";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? "" : "This reset link is incomplete. Request a new one.");
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mismatch) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) setError(json.error ?? "Something went wrong. Please try again.");
      else setDone(true);
    } catch {
      setError("Network error, please try again.");
    }
    setLoading(false);
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

        {done ? (
          <>
            <div className="auth-notice success" role="status">
              <strong>Password changed</strong>
              <span>You can now sign in with your new password.</span>
            </div>
            <Link href="/login" className="admin2-btn" style={{ height: 48, justifyContent: "center" }}>
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h1>Set a new password</h1>
              <p>Choose a password with at least 8 characters.</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="admin2-field">
                <label htmlFor="password">
                  New password<span className="req">*</span>
                </label>
                <PasswordInput id="password" required minLength={8} autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="admin2-field">
                <label htmlFor="confirm">
                  Confirm new password<span className="req">*</span>
                </label>
                <PasswordInput
                  id="confirm"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  className={mismatch ? "field-invalid" : undefined}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {mismatch && <span className="field-error">Passwords don&apos;t match.</span>}
              </div>
              {error && (
                <div className="auth-notice error" role="alert">
                  <span>{error}</span>
                  <Link href="/forgot-password">Request a new link</Link>
                </div>
              )}
              <button type="submit" className="admin2-btn" style={{ height: 48, justifyContent: "center" }} disabled={loading || !token || mismatch}>
                {loading ? "Saving…" : "Save new password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
