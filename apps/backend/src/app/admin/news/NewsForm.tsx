"use client";

import { useState } from "react";

import { ImageUploadField } from "@/components/ImageUploadField";

import { createNewsAction, updateNewsAction } from "./actions";

type NewsFormProps = {
  mode?: "create" | "edit";
  initial?: {
    _id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    status: string;
    images?: string[];
    source5W1H?: { what?: string; who?: string; when?: string; where?: string; why?: string; how?: string };
  };
};

export function NewsForm({ mode = "create", initial }: NewsFormProps) {
  const [draft, setDraft] = useState(initial?.content ?? "");
  const [fields, setFields] = useState({
    what: initial?.source5W1H?.what ?? "",
    who: initial?.source5W1H?.who ?? "",
    when: initial?.source5W1H?.when ?? "",
    where: initial?.source5W1H?.where ?? "",
    why: initial?.source5W1H?.why ?? "",
    how: initial?.source5W1H?.how ?? "",
  });

  function generateDraft() {
    const lines = [
      fields.what,
      fields.who && `Melibatkan: ${fields.who}`,
      fields.when && `Waktu: ${fields.when}`,
      fields.where && `Lokasi: ${fields.where}`,
      fields.why && `Latar belakang: ${fields.why}`,
      fields.how && `Detail pelaksanaan: ${fields.how}`,
    ].filter(Boolean);
    setDraft(lines.join("\n\n"));
  }

  return (
    <form className="stack" action={mode === "edit" ? updateNewsAction : createNewsAction} style={{ marginTop: 16 }}>
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial._id} />}
      <label>
        Title
        <input name="title" required maxLength={200} defaultValue={initial?.title} />
      </label>
      <label>
        Category
        <input name="category" required defaultValue={initial?.category ?? "General"} />
      </label>
      <label>
        Summary
        <textarea name="summary" required maxLength={500} defaultValue={initial?.summary} />
      </label>

      <fieldset style={{ border: "1px solid var(--line)", padding: 12 }}>
        <legend style={{ fontSize: 13, fontWeight: 600 }}>5W + 1H</legend>
        {(["what", "who", "when", "where", "why", "how"] as const).map((key) => (
          <label key={key} style={{ marginTop: 8 }}>
            {key.toUpperCase()}
            <input
              name={key}
              value={fields[key]}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        <button type="button" className="btn outline" style={{ marginTop: 10 }} onClick={generateDraft}>
          Generate draft from 5W+1H
        </button>
      </fieldset>

      <label>
        Content (editable draft)
        <textarea
          name="content"
          required
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ minHeight: 160 }}
        />
      </label>

      <label>
        Status
        <select name="status" defaultValue={initial?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <ImageUploadField name="image" label="Cover image" defaultValue={initial?.images?.[0]} />

      <button type="submit" className="btn">
        {mode === "edit" ? "Save changes" : "Save article"}
      </button>
    </form>
  );
}
