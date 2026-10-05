"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CategoryField } from "@/components/CategoryField";

import { createResearchAction, updateResearchAction } from "./actions";

type FormAction = (formData: FormData) => Promise<void>;

type ResearchFormProps = {
  mode: "create" | "edit";
  /** Defaults to the admin actions; the dosen dashboard passes its own. */
  createAction?: FormAction;
  updateAction?: FormAction;
  /** Lecturer mode: no status picker, saving submits the item for admin review. */
  forReview?: boolean;
  /** A lecturer an admin has trusted with the HTML mode. */
  htmlAllowed?: boolean;
  initial?: {
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    categories?: string[];
    image?: string;
    publishedAt?: string;
    publishedAtManual?: boolean;
  };
};

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Full-page research editor - same layout family as the News editor (§2 of the eval doc). */
export function ResearchForm({
  mode,
  initial,
  createAction = createResearchAction,
  updateAction = updateResearchAction,
  forReview = false,
  htmlAllowed = false,
}: ResearchFormProps) {
  const [status, setStatus] = useState(forReview ? "review" : initial?.status ?? "draft");
  const [dateMode, setDateMode] = useState<"auto" | "manual">(initial?.publishedAtManual ? "manual" : "auto");
  const [manualDate, setManualDate] = useState(toDateInputValue(initial?.publishedAt));
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cover, setCover] = useState(initial?.image ?? "");

  const checklist = [
    { label: "Title", done: title.trim().length > 0 },
    { label: "Short description", done: description.trim().length > 0 },
    { label: "Content", done: (initial?.content ?? "").trim().length > 0 },
    { label: "Cover image", done: cover.length > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <form action={mode === "edit" ? updateAction : createAction}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="dateMode" value={dateMode} />
      <input type="hidden" name="publishedAtManual" value={manualDate} />

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label htmlFor="title">
                Title<span className="req">*</span>
              </label>
              <input id="title" name="title" type="text" required maxLength={200} placeholder="Research topic name" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="admin2-field">
              <label htmlFor="description">
                Short description<span className="req">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                placeholder="One or two sentences shown on cards"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          <section className="admin2-section" style={{ padding: 0 }}>
            <div className="admin2-panel-toolbar" style={{ padding: "18px 28px" }}>
              <h2>Content</h2>
            </div>
            <div style={{ padding: "0 28px 28px" }}>
              <RichTextEditor allowHtml={!forReview || htmlAllowed} name="content" defaultValue={initial?.content} placeholder="Background, methods, publications…" minHeight={320} required />
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Categories</h2>
            <CategoryField kind="research" defaultValue={initial?.categories} />
          </section>
          {forReview ? (
            <section className="admin2-section pad-sm">
              <h2>Publishing</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#5b6664" }}>Your submission goes to the AILO admins for review. They may edit it before publishing.</p>
            </section>
          ) : (
            <section className="admin2-section pad-sm">
              <h2>Publishing</h2>
              <div className="admin2-radio-group" role="radiogroup" aria-label="Status" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {(["draft", "review", "published", "archived"] as const).map((s) => (
                  <button key={s} type="button" className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                    {s === "draft" ? "Draft" : s === "review" ? "Review" : s === "published" ? "Published" : "Archived"}
                  </button>
                ))}
              </div>
              <div className="admin2-field" style={{ marginTop: 16 }}>
                <label>Publish date</label>
                <div className="admin2-radio-group" role="radiogroup" aria-label="Publish date mode">
                  <button type="button" className={dateMode === "auto" ? "active" : ""} onClick={() => setDateMode("auto")}>
                    Automatic
                  </button>
                  <button type="button" className={dateMode === "manual" ? "active" : ""} onClick={() => setDateMode("manual")}>
                    Manual
                  </button>
                </div>
                {dateMode === "auto" ? (
                  <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#6b7573" }}>Uses the moment this item is first published.</p>
                ) : (
                  <input type="date" aria-label="Publish date" style={{ marginTop: 8 }} value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                )}
              </div>
            </section>
          )}

          <section className="admin2-section pad-sm">
            <h2>Cover image</h2>
            <ImageUploadField name="image" label="" defaultValue={cover} onChangeUrl={setCover} hint="16:9 works best - PNG, JPG or WEBP" />
          </section>

          <section className="admin2-section pad-sm">
            <div style={{ display: "flex", alignItems: "center" }}>
              <h2>Ready to publish?</h2>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#7a4a12" }}>
                {doneCount} / {checklist.length}
              </span>
            </div>
            <ul className="admin2-checklist">
              {checklist.map((c) => (
                <li key={c.label} className={c.done ? "done" : ""}>
                  {c.done ? (
                    <span className="dot-done">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </span>
                  ) : (
                    <span className="dot-todo" />
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
          </section>

          <button type="submit" className="admin2-btn" style={{ width: "100%", justifyContent: "center" }}>
            {forReview ? "Submit for review" : mode === "edit" ? "Save changes" : "Create research"}
          </button>
        </div>
      </div>
    </form>
  );
}
