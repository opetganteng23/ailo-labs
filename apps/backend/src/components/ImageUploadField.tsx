"use client";

import { useId, useRef, useState } from "react";

/**
 * Drag & drop (or click to browse) upload area. Shows the chosen file's name
 * and a preview, and stores the uploaded URL in a hidden input under `name`.
 */
export function ImageUploadField({
  name,
  label,
  defaultValue,
  endpoint = "/api/upload",
  accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  onChangeUrl,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  /** Which upload endpoint to POST to - admin pages use the default (auth-gated); public forms (e.g. member registration) pass a public endpoint. */
  endpoint?: string;
  accept?: string;
  /** Optional: notified whenever the uploaded URL changes, for callers (e.g. manual-fetch forms) that need the value outside the hidden input. */
  onChangeUrl?: (url: string) => void;
  /** Small helper line under the prompt, e.g. recommended size. */
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [fileName, setFileName] = useState(defaultValue ? decodeURIComponent(defaultValue.split("/").pop() ?? "") : "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setStatus("uploading");
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatus("error");
        setError(json.error ?? "Upload failed, try again.");
        return;
      }
      setUrl(json.data.url);
      setFileName(file.name);
      onChangeUrl?.(json.data.url);
      setStatus("idle");
    } catch {
      setStatus("error");
      setError("Upload failed, try again.");
    }
  }

  function clear() {
    setUrl("");
    setFileName("");
    onChangeUrl?.("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const isPdf = /\.pdf$/i.test(url);
  const types = accept
    .split(",")
    .map((t) => t.split("/")[1]?.replace("svg+xml", "svg").replace("jpeg", "jpg").toUpperCase())
    .filter(Boolean)
    .join(", ");

  return (
    <div className="upload-field">
      {label && (
        <label htmlFor={inputId} className="upload-field-label">
          {label}
        </label>
      )}
      <input type="hidden" name={name} value={url} />
      <label
        htmlFor={inputId}
        className={`upload-drop${dragging ? " dragging" : ""}${url ? " has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
      >
        {url && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element -- previewing an arbitrary uploaded file
          <img src={url} alt="" className="upload-thumb" />
        ) : (
          <span className="upload-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </span>
        )}
        <span className="upload-text">
          <span className="upload-title">
            {status === "uploading" ? "Uploading…" : fileName || (dragging ? "Drop to upload" : "Drag & drop a file, or click to browse")}
          </span>
          <span className="upload-hint">{url ? "Click or drop another file to replace" : hint ?? types}</span>
        </span>
        <input ref={inputRef} id={inputId} type="file" accept={accept} onChange={(e) => upload(e.target.files?.[0])} hidden />
      </label>
      {url && (
        <div className="upload-actions">
          {isPdf && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              View PDF
            </a>
          )}
          <button type="button" onClick={clear}>
            Remove
          </button>
        </div>
      )}
      {status === "error" && <span className="field-error">{error}</span>}
    </div>
  );
}
