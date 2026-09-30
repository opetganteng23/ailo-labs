"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({ backHref }: { backHref: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setSent(json.data.message);
      }
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

        {sent ? (
          <>
            <div className="auth-notice success" role="status">
              <strong>Check your inbox</strong>
              <span>{sent}</span>
              <span>Didn&apos;t get it? Check spam, or send the link again.</span>
            </div>
            <button type="button" className="admin2-btn outline" style={{ height: 46, justifyContent: "center" }} onClick={() => setSent("")}>
              Send again
            </button>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h1>Forgot your password?</h1>
              <p>Enter the email you sign in with. We&apos;ll email you a link to set a new password.</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="admin2-field">
                <label htmlFor="email">
                  Email<span className="req">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  className={error ? "field-invalid" : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
                {error && <span className="field-error">{error}</span>}
              </div>
              <button type="submit" className="admin2-btn" style={{ height: 48, justifyContent: "center" }} disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <Link href={backHref} className="auth-back">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
