"use client";

import { useState } from "react";

export function ImageUploadField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        return;
      }
      setUrl(json.data.url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <label>
      {label}
      <input type="hidden" name={name} value={url} />
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={handleFile} />
      {status === "uploading" && <span style={{ fontSize: 12, color: "#5b6469", fontWeight: 400 }}>Uploading...</span>}
      {status === "error" && <span className="error-text">Upload failed, try again.</span>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file, next/image's static optimization isn't needed here
        <img src={url} alt="Preview" style={{ maxWidth: 160, maxHeight: 120, marginTop: 8, borderRadius: 3, border: "1px solid var(--line)" }} />
      )}
    </label>
  );
}
