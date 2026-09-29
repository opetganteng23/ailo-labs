"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";
import { RichTextEditor } from "@/components/RichTextEditor";

import { createResearchAction, updateResearchAction } from "./actions";

type ResearchDrawerProps = {
  mode: "create" | "edit";
  initial?: {
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    image?: string;
  };
};

export function ResearchDrawer({ mode, initial }: ResearchDrawerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initial?.status ?? "draft");

  function close() {
    router.push("/admin/research");
  }

  return (
    <div className="drawer-overlay" onClick={close}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>{mode === "edit" ? "Edit research" : "New research"}</h2>
          <button type="button" aria-label="Close" onClick={close} className="drawer-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form
          id="research-drawer-form"
          action={mode === "edit" ? updateResearchAction : createResearchAction}
          className="drawer-body"
        >
          {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
          <input type="hidden" name="status" value={status} />

          <div className="admin2-field">
            <label htmlFor="title">
              Title<span className="req">*</span>
            </label>
            <input id="title" name="title" type="text" required maxLength={200} placeholder="Research topic name" defaultValue={initial?.title} />
          </div>
          <div className="admin2-field">
            <label htmlFor="description">
              Short description<span className="req">*</span>
            </label>
            <textarea id="description" name="description" required maxLength={500} rows={2} placeholder="One or two sentences shown on cards" defaultValue={initial?.description} />
          </div>
          <div className="admin2-field">
            <label htmlFor="content">Content</label>
            <RichTextEditor name="content" defaultValue={initial?.content} placeholder="Background, methods, publications…" minHeight={160} />
          </div>
          <ImageUploadField name="image" label="Cover image" defaultValue={initial?.image} hint="16:9 works best - PNG, JPG or WEBP" />
        </form>

        <div className="drawer-foot">
          <div className="admin2-field" style={{ margin: 0 }}>
            <select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ height: 42, width: 140 }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <button type="button" className="admin2-btn ghost" onClick={close}>
            Cancel
          </button>
          <button type="submit" form="research-drawer-form" className="admin2-btn">
            {mode === "edit" ? "Save changes" : "Create research"}
          </button>
        </div>
      </div>
    </div>
  );
}
