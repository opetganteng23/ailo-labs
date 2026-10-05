"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { CatalogConfig } from "@/lib/catalog";

import { createCatalogAction, updateCatalogAction } from "./actions";

export type CatalogInitial = {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  image?: string;
  link?: string;
  file?: string;
  author?: string;
  year?: string;
  order?: number;
  status?: string;
  logoDark?: boolean;
};

export function CatalogForm({ config, initial }: { config: CatalogConfig; initial?: CatalogInitial }) {
  const [status, setStatus] = useState(initial?.status ?? "published");
  const editing = Boolean(initial);

  return (
    <form action={editing ? updateCatalogAction : createCatalogAction}>
      <input type="hidden" name="kind" value={config.kind} />
      {initial && <input type="hidden" name="id" value={initial._id} />}
      <input type="hidden" name="status" value={status} />

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label htmlFor="title">
                {config.titleLabel}
                <span className="req">*</span>
              </label>
              <input id="title" name="title" type="text" required maxLength={200} defaultValue={initial?.title ?? ""} />
            </div>
            {config.author && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div className="admin2-field">
                  <label htmlFor="author">Author</label>
                  <input id="author" name="author" type="text" defaultValue={initial?.author ?? ""} />
                </div>
                <div className="admin2-field">
                  <label htmlFor="year">Year</label>
                  <input id="year" name="year" type="text" defaultValue={initial?.year ?? ""} />
                </div>
              </div>
            )}
            <div className="admin2-field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={4} defaultValue={initial?.description ?? ""} />
            </div>
            {config.link && (
              <div className="admin2-field">
                <label htmlFor="link">{config.link}</label>
                <input id="link" name="link" type="url" placeholder="https://" defaultValue={initial?.link ?? ""} />
              </div>
            )}
          </section>

          {config.content && (
            <section className="admin2-section" style={{ padding: 0 }}>
              <div className="admin2-panel-toolbar" style={{ padding: "18px 28px" }}>
                <h2>Details</h2>
              </div>
              <div style={{ padding: "0 28px 28px" }}>
                <RichTextEditor allowHtml name="content" defaultValue={initial?.content} placeholder="Describe this service in detail…" minHeight={280} />
              </div>
            </section>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Visibility</h2>
            <div className="admin2-radio-group" role="radiogroup" aria-label="Status" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              {(["published", "draft"] as const).map((s) => (
                <button key={s} type="button" className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                  {s === "published" ? "Published" : "Draft"}
                </button>
              ))}
            </div>
            <div className="admin2-field" style={{ marginTop: 16 }}>
              <label htmlFor="order">Order</label>
              <input id="order" name="order" type="number" defaultValue={initial?.order ?? 0} />
              <span style={{ fontSize: 12.5, color: "#6b7573" }}>Lower numbers appear first.</span>
            </div>
          </section>

          <section className="admin2-section pad-sm">
            <h2>{config.kind === "partners" ? "Logo" : "Image"}</h2>
            <ImageUploadField name="image" label="" defaultValue={initial?.image} hint={config.kind === "partners" ? "Logo with transparent or white background" : "PNG, JPG or WEBP"} />
            {config.file && (
              <div style={{ marginTop: 14 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700 }}>Book file (PDF)</h3>
                <ImageUploadField name="file" label="" defaultValue={initial?.file} endpoint="/api/upload-pdf" accept="application/pdf" hint="Readable on the site. PDF, up to 50 MB" />
              </div>
            )}
            {config.kind === "partners" && (
              <label style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 14, fontWeight: 500 }}>
                <input type="checkbox" name="logoDark" defaultChecked={Boolean(initial?.logoDark)} style={{ marginTop: 3 }} />
                <span>
                  This logo is white or light
                  <span style={{ display: "block", fontSize: 12.5, color: "#6b7573" }}>Shows it on a dark chip in the homepage strip so it stays visible.</span>
                </span>
              </label>
            )}
          </section>

          <button type="submit" className="admin2-btn" style={{ width: "100%", justifyContent: "center" }}>
            {editing ? "Save changes" : `Add ${config.singular}`}
          </button>
        </div>
      </div>
    </form>
  );
}
