"use client";

import { useId, useState } from "react";

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
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await uploadFile(file);
  }

  async function uploadFile(file: File | undefined) {
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
    <div className="upload-field">
      {label && <span className="upload-field-label">{label}</span>}
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}
      {urls.length > 0 && (
        <div className="upload-gallery">
          {urls.map((url, i) => (
            <div key={url} className="upload-gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file */}
              <img src={url} alt="" />
              <button type="button" onClick={() => removeAt(i)} aria-label="Remove image">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <label
        htmlFor={inputId}
        className={`upload-drop${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFile(e.dataTransfer.files?.[0]);
        }}
      >
        <span className="upload-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
        </span>
        <span className="upload-text">
          <span className="upload-title">{status === "uploading" ? "Uploading…" : urls.length ? "Add another image" : "Drag & drop an image, or click to browse"}</span>
          <span className="upload-hint">
            {urls.length > 1 ? `${urls.length} images set - they slide as the section background` : "PNG, JPG, WEBP, GIF or SVG"}
          </span>
        </span>
        <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={handleFile} hidden />
      </label>
      {status === "error" && <span className="field-error">Upload failed, try again.</span>}
    </div>
  );
}
