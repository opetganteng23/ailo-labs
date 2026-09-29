"use client";

import { useState } from "react";

export function MultiImageUploadField({
  name,
  label,
  defaultValues,
  onChangeUrls,
}: {
  name: string;
  label: string;
  defaultValues?: string[];
  /** Optional: notified whenever the URL list changes, for callers that mirror it into a live preview. */
  onChangeUrls?: (urls: string[]) => void;
}) {
  const [urls, setUrlsState] = useState<string[]>(defaultValues ?? []);

  function setUrls(next: string[] | ((prev: string[]) => string[])) {
    setUrlsState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      onChangeUrls?.(resolved);
      return resolved;
    });
  }

  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

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
      setUrls((prev) => [...prev, json.data.url]);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <label>
      {label}
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {urls.map((url, i) => (
          <div key={url} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file */}
            <img src={url} alt="" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 3, border: "1px solid var(--line)" }} />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove image"
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "none",
                background: "#9d1b1b",
                color: "#fff",
                fontSize: 12,
                lineHeight: "20px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={handleFile} style={{ marginTop: 8 }} />
      {status === "uploading" && <span style={{ fontSize: 12, color: "#5b6469", fontWeight: 400 }}>Uploading...</span>}
      {status === "error" && <span className="error-text">Upload failed, try again.</span>}
      {urls.length > 1 && (
        <span style={{ fontSize: 12, color: "#5b6469", fontWeight: 400, display: "block", marginTop: 4 }}>
          {urls.length} images set - they will slide/rotate as the section background.
        </span>
      )}
    </label>
  );
}
