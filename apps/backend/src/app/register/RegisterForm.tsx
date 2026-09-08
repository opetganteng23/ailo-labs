"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterFormInner() {
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
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch {
      setError("Network error, please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h1>Register</h1>
      <p style={{ marginTop: 8, color: "#5b6469" }}>
        Create an account to borrow a lab. Already have one?{" "}
        <Link href="/login" style={{ color: "var(--teal-dark)", fontWeight: 600 }}>
          Sign in here
        </Link>
        .
      </p>
      <form className="stack" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label>
          Full name
          <input name="name" required maxLength={160} autoFocus />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Phone
          <input name="phone" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
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
