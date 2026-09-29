"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";
import { MEMBER_CATEGORIES } from "@/lib/memberCategories";

export function JoinForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      affiliation: form.get("affiliation"),
      requestedAs: form.get("requestedAs"),
      photo: form.get("photo"),
      proofDocument: form.get("proofDocument"),
    };

    try {
      const res = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        setMessage(json.error ?? "Unable to submit application.");
        return;
      }
      setStatus("success");
      setMessage("Application submitted. Check your email for confirmation - an admin will review it soon.");
    } catch {
      setStatus("error");
      setMessage("Network error, please try again.");
    }
  }

  if (status === "success") {
    return <p className="notice">{message}</p>;
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
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
        Affiliation
        <input name="affiliation" placeholder="e.g. Informatics, Telkom University" required />
      </label>
      <label>
        Apply as
        <select name="requestedAs" defaultValue={MEMBER_CATEGORIES[1]}>
          {MEMBER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>
      <ImageUploadField name="photo" label="Photo (for your member card)" endpoint="/api/members/upload" />
      <ImageUploadField
        name="proofDocument"
        label="Proof of affiliation (KTM / surat keterangan, image or PDF)"
        endpoint="/api/members/upload"
        accept="image/png,image/jpeg,image/webp,application/pdf"
      />
      {status === "error" && <p className="error-text">{message}</p>}
      <button type="submit" className="btn primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
