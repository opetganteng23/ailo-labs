"use client";

import { useState } from "react";

export function ImageUploadField({
  name,
  label,
  defaultValue,
  endpoint = "/api/upload",
  accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  onChangeUrl,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  /** Which upload endpoint to POST to - admin pages use the default (auth-gated); public forms (e.g. member registration) pass a public endpoint. */
  endpoint?: string;
  accept?: string;
  /** Optional: notified whenever the uploaded URL changes, for callers (e.g. manual-fetch forms) that need the value outside the hidden input. */
  onChangeUrl?: (url: string) => void;
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
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        return;
      }
      setUrl(json.data.url);
      onChangeUrl?.(json.data.url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const isPdf = /\.pdf$/i.test(url);

  return (
    <label>
      {label}
      <input type="hidden" name={name} value={url} />
      <input type="file" accept={accept} onChange={handleFile} />
      {status === "uploading" && <span style={{ fontSize: 12, color: "#5b6469", fontWeight: 400 }}>Uploading...</span>}
      {status === "error" && <span className="error-text">Upload failed, try again.</span>}
      {url && isPdf && (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, marginTop: 8, display: "inline-block" }}>
          View uploaded PDF
        </a>
      )}
      {url && !isPdf && (
        // eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file, next/image's static optimization isn't needed here
        <img src={url} alt="Preview" style={{ maxWidth: 160, maxHeight: 120, marginTop: 8, borderRadius: 3, border: "1px solid var(--line)" }} />
      )}
    </label>
  );
}
