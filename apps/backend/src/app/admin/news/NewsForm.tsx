"use client";

import { useMemo, useState } from "react";

import { RichTextEditor } from "@/components/RichTextEditor";

import { createNewsAction, updateNewsAction } from "./actions";

type NewsFormProps = {
  mode?: "create" | "edit";
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
  };
};

const FIVE_W_1_H = [
  { key: "what", tag: "WHAT", label: "Apa yang terjadi?", placeholder: "mis. Penandatanganan kerja sama hilirisasi riset AI", required: true },
  { key: "who", tag: "WHO", label: "Siapa yang terlibat?", placeholder: "Institusi, tokoh, jabatan", required: false },
  { key: "when", tag: "WHEN", label: "Kapan?", placeholder: "Tanggal & waktu kegiatan", required: false, isInput: true },
  { key: "where", tag: "WHERE", label: "Di mana?", placeholder: "Lokasi atau platform", required: false, isInput: true },
  { key: "why", tag: "WHY", label: "Mengapa penting?", placeholder: "Latar belakang dan dampaknya", required: false },
  { key: "how", tag: "HOW", label: "Bagaimana prosesnya?", placeholder: "Rangkaian acara, mekanisme, tindak lanjut", required: false },
] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const DEFAULT_CATEGORIES = ["General", "Collaboration", "Research", "Event"];

export function NewsForm({ mode = "create", initial, categories = [] }: NewsFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [draft, setDraft] = useState(initial?.content ?? "");
  const [draftVersion, setDraftVersion] = useState(0);
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [contentMode, setContentMode] = useState<"ai" | "manual">(
    initial && !Object.values(initial.source5W1H ?? {}).some((v) => v?.trim()) && initial.content ? "manual" : "ai",
  );
  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...categories]);
    if (initial?.category) set.add(initial.category);
    return Array.from(set);
  }, [categories, initial]);
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
    const lines = [
      fields.what,
      fields.who && `Melibatkan: ${fields.who}`,
      fields.when && `Waktu: ${fields.when}`,
      fields.where && `Lokasi: ${fields.where}`,
      fields.why && `Latar belakang: ${fields.why}`,
      fields.how && `Detail pelaksanaan: ${fields.how}`,
    ].filter(Boolean);
    setDraft(lines.map((l) => `<p>${l}</p>`).join(""));
    setDraftVersion((v) => v + 1);
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
    <form action={mode === "edit" ? updateNewsAction : createNewsAction}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="tags" value={tags.join(",")} />
      <input type="hidden" name="image" value={cover} />

      <div className="admin2-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <section className="admin2-section">
            <div className="admin2-field">
              <label htmlFor="title">Headline</label>
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
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                name="summary"
                required
                maxLength={280}
                rows={3}
                placeholder="Ringkas berita dalam 1-2 kalimat..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <span style={{ fontSize: 12, color: "#6b7573", alignSelf: "flex-end" }}>{summary.length} / 280</span>
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

            {contentMode === "ai" && (
              <>
                <div className="admin2-panel-toolbar" style={{ padding: "20px 28px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
                    <h2>Story facts - 5W + 1H</h2>
                    <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>
                      Answer the six questions. The draft below is assembled from your answers.
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
                  {FIVE_W_1_H.map((f) => (
                    <div key={f.key} className={`admin2-field${f.required ? " required" : ""}`}>
                      <label htmlFor={`w-${f.key}`}>
                        <span className="admin2-5w1h-tag">{f.tag}</span>
                        {f.label}
                        {f.required && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#b4410c" }}>Required</span>}
                      </label>
                      {"isInput" in f && f.isInput ? (
                        <input
                          id={`w-${f.key}`}
                          type="text"
                          placeholder={f.placeholder}
                          value={fields[f.key]}
                          onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                        />
                      ) : (
                        <textarea
                          id={`w-${f.key}`}
                          rows={2}
                          placeholder={f.placeholder}
                          value={fields[f.key]}
                          onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
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
              <h2>Article body</h2>
              {contentMode === "ai" && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0e6b73", background: "#e3f1f1", borderRadius: 999, padding: "4px 10px" }}>
                  Generated from 5W+1H - editable
                </span>
              )}
            </div>
            <div style={{ padding: "20px 28px 28px" }}>
              <RichTextEditor key={draftVersion} name="content" defaultValue={draft} placeholder="Write the article body…" />
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <h2>Publishing</h2>
            <div className="admin2-radio-group" role="radiogroup" aria-label="Status">
              {(["draft", "review", "published"] as const).map((s) => (
                <button key={s} type="button" className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
                  {s === "draft" ? "Draft" : s === "review" ? "Review" : "Published"}
                </button>
              ))}
            </div>
          </section>

          <section className="admin2-section pad-sm">
            <h2>Organize</h2>
            <div className="admin2-field">
              <label htmlFor="category">
                Category <span style={{ fontWeight: 500, color: "#6b7573" }}>(pick one or type a new one)</span>
              </label>
              <input id="category" name="category" type="text" list="category-options" required value={category} onChange={(e) => setCategory(e.target.value)} />
              <datalist id="category-options">
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
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
            {mode === "edit" ? "Save changes" : "Save article"}
          </button>
        </div>
      </div>
    </form>
  );
}
