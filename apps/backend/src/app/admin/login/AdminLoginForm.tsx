"use client";

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
      router.push(searchParams.get("next") ?? "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error - please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h1>Admin Login</h1>
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
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export function AdminLoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
