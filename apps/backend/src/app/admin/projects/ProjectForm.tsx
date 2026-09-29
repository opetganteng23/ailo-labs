"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";

import { createProjectAction, updateProjectAction } from "./actions";

type ProjectFormProps = {
  mode?: "create" | "edit";
  initial?: {
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    image?: string;
  };
};

export function ProjectForm({ mode = "create", initial }: ProjectFormProps) {
  const [status, setStatus] = useState(initial?.status ?? "planned");

  return (
    <form action={mode === "edit" ? updateProjectAction : createProjectAction}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
      <input type="hidden" name="status" value={status} />

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" required maxLength={200} defaultValue={initial?.title} />
            </div>
            <div className="admin2-field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" required maxLength={500} rows={3} defaultValue={initial?.description} />
            </div>
            <div className="admin2-field">
              <label htmlFor="content">Content</label>
              <textarea id="content" name="content" required rows={12} defaultValue={initial?.content} />
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Status</h2>
            <div className="admin2-radio-group" role="radiogroup" aria-label="Status">
              {(["planned", "ongoing", "completed"] as const).map((s) => (
                <button key={s} type="button" className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="admin2-section pad-sm">
            <h2>Cover image</h2>
            <ImageUploadField name="image" label="" defaultValue={initial?.image} />
          </section>

          <button type="submit" className="admin2-btn" style={{ width: "100%", justifyContent: "center" }}>
            {mode === "edit" ? "Save changes" : "Create project"}
          </button>
        </div>
      </div>
    </form>
  );
}
