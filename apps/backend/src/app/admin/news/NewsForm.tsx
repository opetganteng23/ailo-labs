"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "@/lib/toast";

import { createNewsAction, updateNewsAction } from "./actions";
import { addCategoryInlineAction } from "./categories/actions";

type FormAction = (formData: FormData) => Promise<void>;

type NewsFormProps = {
  mode?: "create" | "edit";
  createAction?: FormAction;
  updateAction?: FormAction;
  /** Lecturer mode: status is fixed to "review" and categories can't be managed. */
  forReview?: boolean;
  categories?: string[];
  initial?: {
    _id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    status: string;
    tags?: string[];
    images?: string[];
    source5W1H?: { what?: string; who?: string; when?: string; where?: string; why?: string; how?: string };
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

// Every 5W+1H answer is needed to generate a complete draft (QA NEWS-01/02).
const FIVE_W_1_H = [
  { key: "what", tag: "WHAT", label: "Apa yang terjadi?", placeholder: "mis. Penandatanganan kerja sama hilirisasi riset AI" },
  { key: "who", tag: "WHO", label: "Siapa yang terlibat?", placeholder: "Institusi, tokoh, jabatan" },
  { key: "when", tag: "WHEN", label: "Kapan?", placeholder: "Tanggal & waktu kegiatan" },
  { key: "where", tag: "WHERE", label: "Di mana?", placeholder: "Lokasi atau platform" },
  { key: "why", tag: "WHY", label: "Mengapa penting?", placeholder: "Latar belakang dan dampaknya" },
  { key: "how", tag: "HOW", label: "Bagaimana prosesnya?", placeholder: "Rangkaian acara, mekanisme, tindak lanjut" },
] as const;

type FieldKey = (typeof FIVE_W_1_H)[number]["key"];

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function NewsForm({
  mode = "create",
  initial,
  categories = [],
  createAction = createNewsAction,
  updateAction = updateNewsAction,
  forReview = false,
}: NewsFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [draft, setDraft] = useState(initial?.content ?? "");
  const [draftVersion, setDraftVersion] = useState(0);
  const [status, setStatus] = useState(forReview ? "review" : initial?.status ?? "draft");
  const [dateMode, setDateMode] = useState<"auto" | "manual">(initial?.publishedAtManual ? "manual" : "auto");
  const [manualDate, setManualDate] = useState(toDateInputValue(initial?.publishedAt));
  const [category, setCategory] = useState(initial?.category ?? (categories.includes("General") ? "General" : categories[0] ?? ""));
  const [contentMode, setContentMode] = useState<"ai" | "manual">(
    initial && !Object.values(initial.source5W1H ?? {}).some((v) => v?.trim()) && initial.content ? "manual" : "ai",
  );
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const categoryOptions = useMemo(() => {
    const set = new Set([...categories, ...extraCategories]);
    if (initial?.category) set.add(initial.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, extraCategories, initial]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [savingCategory, startCategoryTransition] = useTransition();
  const [missing, setMissing] = useState<FieldKey[]>([]);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [cover, setCover] = useState(initial?.images?.[0] ?? "");
  const [coverStatus, setCoverStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [fields, setFields] = useState({
    what: initial?.source5W1H?.what ?? "",
    who: initial?.source5W1H?.who ?? "",
    when: initial?.source5W1H?.when ?? "",
    where: initial?.source5W1H?.where ?? "",
    why: initial?.source5W1H?.why ?? "",
    how: initial?.source5W1H?.how ?? "",
  });

  const answeredCount = Object.values(fields).filter((v) => v.trim()).length;
  const slug = useMemo(() => slugify(title), [title]);

  const checklist = [
    { label: "Headline", done: title.trim().length > 0 },
    { label: "Category & tags", done: tags.length > 0 },
    { label: "Article body", done: draftVersion > 0 || draft.trim().length > 0 },
    { label: "5W+1H complete", done: answeredCount === 6 },
    { label: "Summary", done: summary.trim().length > 0 },
    { label: "Cover image", done: cover.length > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  function generateDraft() {
    const empty = FIVE_W_1_H.filter((f) => !fields[f.key].trim()).map((f) => f.key);
    setMissing(empty);
    if (empty.length > 0) {
      toast("error", `Fill in all 5W+1H questions before generating (${empty.length} still empty).`);
      document.getElementById(`w-${empty[0]}`)?.focus();
      return;
    }
    const lines = [
      fields.what,
      fields.who && `Melibatkan: ${fields.who}`,
      fields.when && `Waktu: ${fields.when}`,
      fields.where && `Lokasi: ${fields.where}`,
      fields.why && `Latar belakang: ${fields.why}`,
      fields.how && `Detail pelaksanaan: ${fields.how}`,
    ].filter(Boolean);
    setDraft(lines.map((l) => `<p>${escapeHtml(String(l))}</p>`).join(""));
    setDraftVersion((v) => v + 1);
    toast("success", "Draft generated. Review and edit it in the article body.");
  }

  function saveNewCategory() {
    const name = newCategory.trim();
    if (!name) {
      setCategoryError("Enter a category name.");
      return;
    }
    startCategoryTransition(async () => {
      const result = await addCategoryInlineAction(name);
      if (!result.ok) {
        setCategoryError(result.error);
        return;
      }
      setExtraCategories((list) => [...list, result.name]);
      setCategory(result.name);
      setNewCategory("");
      setCategoryError("");
      setAddingCategory(false);
      toast("success", `Category "${result.name}" added.`);
    });
  }

  function addTag(value: string) {
    const v = value.trim();
    if (v && !tags.includes(v)) setTags((t) => [...t, v]);
    setTagInput("");
  }

  async function handleCoverFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCoverStatus("error");
        return;
      }
      setCover(json.data.url);
      setCoverStatus("idle");
    } catch {
      setCoverStatus("error");
    }
  }

  return (
    <form action={mode === "edit" ? updateAction : createAction}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="dateMode" value={dateMode} />
      <input type="hidden" name="publishedAtManual" value={manualDate} />
      <input type="hidden" name="tags" value={tags.join(",")} />
      <input type="hidden" name="image" value={cover} />

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label htmlFor="title">
                Headline<span className="req">*</span>
              </label>
              <textarea
                id="title"
                name="title"
                required
                maxLength={200}
                rows={2}
                className="admin2-headline"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7573" }}>
                <span>Slug: /news/{slug || "…"}</span>
                <span>{title.length} / 200</span>
              </div>
            </div>
            <div style={{ height: 1, background: "#eeece6" }} />
            <div className="admin2-field">
              <label htmlFor="summary">
                Summary<span className="req">*</span>
              </label>
              <textarea
                id="summary"
                name="summary"
                required
                rows={4}
                placeholder="Ringkas berita dalam 1-3 kalimat..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <span style={{ fontSize: 12, color: "#6b7573", alignSelf: "flex-end" }}>{summary.length} characters</span>
            </div>
          </section>

          <section className="admin2-section" style={{ padding: 0 }}>
            <div className="admin2-panel-toolbar" style={{ padding: "20px 28px 0", borderBottom: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
                <h2>How do you want to write this article?</h2>
                <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
                  {contentMode === "ai" ? "Answer 5W+1H and generate a draft, or switch to writing it yourself." : "Write the article body directly."}
                </p>
              </div>
              <div className="admin2-radio-group" role="radiogroup" aria-label="Content mode" style={{ flexShrink: 0 }}>
                <button type="button" className={contentMode === "ai" ? "active" : ""} onClick={() => setContentMode("ai")}>
                  AI (5W+1H)
                </button>
                <button type="button" className={contentMode === "manual" ? "active" : ""} onClick={() => setContentMode("manual")}>
                  Manual
                </button>
              </div>
            </div>

            {contentMode === "manual" &&
              FIVE_W_1_H.map((f) => <input key={f.key} type="hidden" name={f.key} value={fields[f.key]} />)}
            {contentMode === "manual" && <div style={{ height: 24 }} />}
            {contentMode === "ai" && (
              <>
                <div className="admin2-panel-toolbar" style={{ padding: "20px 28px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
                    <h2>Story facts - 5W + 1H</h2>
                    <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
                      Answer the six questions. The draft below is assembled from your answers.
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5b6664" }}>
                      <span className="req" style={{ marginLeft: 0 }}>*</span> wajib diisi (required)
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{answeredCount} of 6 answered</span>
                    <div style={{ width: 140, height: 6, borderRadius: 999, background: "#eeece6", overflow: "hidden" }}>
                      <div style={{ width: `${(answeredCount / 6) * 100}%`, height: "100%", background: "#0e6b73", borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
                <div className="admin2-5w1h-grid" style={{ padding: "0 28px 24px" }}>
                  {FIVE_W_1_H.map((f) => {
                    const isMissing = missing.includes(f.key);
                    return (
                      <div key={f.key} className="admin2-field">
                        <label htmlFor={`w-${f.key}`}>
                          <span className="admin2-5w1h-tag">{f.tag}</span>
                          {f.label}
                          <span className="req">*</span>
                        </label>
                        <textarea
                          id={`w-${f.key}`}
                          name={f.key}
                          rows={3}
                          placeholder={f.placeholder}
                          className={isMissing ? "field-invalid" : undefined}
                          aria-invalid={isMissing || undefined}
                          value={fields[f.key]}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFields((st) => ({ ...st, [f.key]: value }));
                            if (value.trim()) setMissing((m) => m.filter((k) => k !== f.key));
                          }}
                        />
                        {isMissing && <span className="field-error">This field is required.</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: "16px 28px", background: "#f7f6f2", borderTop: "1px solid #eeece6", display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 13, color: "#5b6664", flexGrow: 1 }}>
                    Template mode - connect an LLM API key in <a href="/admin/chatbot/model">AI settings</a> to get fluent prose.
                  </span>
                  <button type="button" className="admin2-btn teal-outline" onClick={generateDraft}>
                    Generate draft
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="admin2-section" style={{ padding: 0 }}>
            <div className="admin2-panel-toolbar" style={{ padding: "18px 28px" }}>
              <h2>
                Article body<span className="req">*</span>
              </h2>
              {contentMode === "ai" && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0e6b73", background: "#e3f1f1", borderRadius: 999, padding: "4px 10px" }}>
                  Generated from 5W+1H - editable
                </span>
              )}
            </div>
            <div style={{ padding: "20px 28px 36px" }}>
              <RichTextEditor key={draftVersion} name="content" defaultValue={draft} placeholder="Write the article body…" required />
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {forReview ? (
            <section className="admin2-section pad-sm">
              <h2>Publishing</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#5b6664" }}>
                Your draft goes to the AILO admins for review. They may edit it before publishing.
              </p>
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
                <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#6b7573" }}>Uses the moment this article is first published.</p>
              ) : (
                <input
                  type="date"
                  aria-label="Publish date"
                  style={{ marginTop: 8 }}
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              )}
            </div>
          </section>
          )}

          <section className="admin2-section pad-sm">
            <h2>Organize</h2>
            <div className="admin2-field">
              <label htmlFor="category" style={{ display: "flex", alignItems: "center" }}>
                <span>
                  Category<span className="req">*</span>
                </span>
                {!forReview && (
                  <Link href="/admin/news/categories" style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 600, color: "#00809d" }}>
                    Manage
                  </Link>
                )}
              </label>
              <select id="category" name="category" required value={category} onChange={(e) => setCategory(e.target.value)}>
                {!categoryOptions.includes(category) && <option value="">Choose a category</option>}
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {forReview ? null : addingCategory ? (
                <div className="admin2-inline-add">
                  <input
                    type="text"
                    aria-label="New category name"
                    placeholder="New category name"
                    maxLength={40}
                    autoFocus
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      setCategoryError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveNewCategory();
                      }
                      if (e.key === "Escape") setAddingCategory(false);
                    }}
                    className={categoryError ? "field-invalid" : undefined}
                  />
                  <button type="button" className="admin2-btn" style={{ height: 40, padding: "0 14px" }} disabled={savingCategory} onClick={saveNewCategory}>
                    {savingCategory ? "Adding…" : "Add"}
                  </button>
                  <button type="button" className="admin2-btn ghost" style={{ height: 40, padding: "0 10px" }} onClick={() => setAddingCategory(false)}>
                    Cancel
                  </button>
                  {categoryError && (
                    <span className="field-error" style={{ flexBasis: "100%", marginTop: 0 }}>
                      {categoryError}
                    </span>
                  )}
                </div>
              ) : (
                <button type="button" className="admin2-link-btn" onClick={() => setAddingCategory(true)}>
                  + Add category
                </button>
              )}
            </div>
            <div className="admin2-field">
              <label htmlFor="tags">Tags</label>
              <div className="admin2-tag-input">
                {tags.map((t) => (
                  <span key={t} className="admin2-tag-chip">
                    {t}
                    <button type="button" onClick={() => setTags((ts) => ts.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  id="tags"
                  type="text"
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  onBlur={() => tagInput && addTag(tagInput)}
                />
              </div>
            </div>
          </section>

          <section className="admin2-section pad-sm">
            <h2>Cover image</h2>
            <label htmlFor="cover" className="admin2-dropzone">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded image preview
                <img src={cover} alt="Cover preview" />
              ) : (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: "#e3f1f1", color: "#0e6b73", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V4M7 9l5-5 5 5" />
                      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#15201f" }}>
                    {coverStatus === "uploading" ? "Uploading…" : "Drop an image or browse"}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7573" }}>1200 x 630 - JPG or PNG</span>
                </>
              )}
              <input id="cover" type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleCoverFile} />
            </label>
            {coverStatus === "error" && <span className="error-text">Upload failed, try again.</span>}
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
            {forReview ? "Submit for review" : mode === "edit" ? "Save changes" : "Save article"}
          </button>
        </div>
      </div>
    </form>
  );
}
