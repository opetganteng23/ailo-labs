"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/auth/user-login", {
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
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch {
      setError("Network error, please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h1>Login</h1>
      <p style={{ marginTop: 8, color: "#5b6469" }}>
        Sign in to book a lab. Don&apos;t have an account yet?{" "}
        <Link href="/register" style={{ color: "var(--teal-dark)", fontWeight: 600 }}>
          Register here
        </Link>
        .
      </p>
      <form className="stack" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label>
          Email
          <input name="email" type="email" required autoFocus />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
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
