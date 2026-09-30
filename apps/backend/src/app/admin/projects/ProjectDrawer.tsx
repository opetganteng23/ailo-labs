"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";
import { RichTextEditor } from "@/components/RichTextEditor";

import { createProjectAction, updateProjectAction } from "./actions";

type FormAction = (formData: FormData) => Promise<void>;

type ProjectDrawerProps = {
  mode: "create" | "edit";
  createAction?: FormAction;
  updateAction?: FormAction;
  /** Lecturer mode: saving submits the project for admin review. */
  forReview?: boolean;
  closeHref: string;
  defaultStatus?: string;
  initial?: {
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    image?: string;
  };
};

/** Side panel for adding or editing a project, same pattern as the Research drawer (QA RP-03). */
export function ProjectDrawer({
  mode,
  closeHref,
  defaultStatus,
  initial,
  createAction = createProjectAction,
  updateAction = updateProjectAction,
  forReview = false,
}: ProjectDrawerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initial?.status ?? defaultStatus ?? "planned");

  function close() {
    router.push(closeHref);
  }

  return (
    <div className="drawer-overlay" onClick={close}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>{mode === "edit" ? "Edit project" : "New project"}</h2>
          <button type="button" aria-label="Close" onClick={close} className="drawer-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form id="project-drawer-form" action={mode === "edit" ? updateAction : createAction} className="drawer-body">
          {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
          <input type="hidden" name="status" value={status} />

          <div className="admin2-field">
            <label htmlFor="title">
              Title<span className="req">*</span>
            </label>
            <input id="title" name="title" type="text" required maxLength={200} placeholder="Project name" defaultValue={initial?.title} />
          </div>
          <div className="admin2-field">
            <label htmlFor="description">
              Short description<span className="req">*</span>
            </label>
            <textarea id="description" name="description" required maxLength={500} rows={2} placeholder="One or two sentences shown on cards" defaultValue={initial?.description} />
          </div>
          <div className="admin2-field">
            <label>Status</label>
            <div className="admin2-radio-group" role="radiogroup" aria-label="Status">
              {(["planned", "ongoing", "completed"] as const).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={status === s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="admin2-field">
            <label>Content</label>
            <RichTextEditor name="content" defaultValue={initial?.content} placeholder="Goals, team, results, links…" minHeight={180} />
          </div>
          <ImageUploadField name="image" label="Cover image" defaultValue={initial?.image} hint="16:9 works best - PNG, JPG or WEBP" />
        </form>

        <div className="drawer-foot">
          {forReview && <span style={{ fontSize: 13, color: "#5b6664", marginRight: "auto" }}>An admin reviews it before it goes live.</span>}
          <button type="button" className="admin2-btn ghost" onClick={close}>
            Cancel
          </button>
          <button type="submit" form="project-drawer-form" className="admin2-btn">
            {forReview ? "Submit for review" : mode === "edit" ? "Save changes" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}
