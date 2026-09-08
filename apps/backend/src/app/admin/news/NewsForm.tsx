"use client";

import { useState } from "react";

import { createNewsAction } from "./actions";

export function NewsForm() {
  const [draft, setDraft] = useState("");
  const [fields, setFields] = useState({ what: "", who: "", when: "", where: "", why: "", how: "" });

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
    <form className="stack" action={createNewsAction} style={{ marginTop: 16 }}>
      <label>
        Title
        <input name="title" required maxLength={200} />
      </label>
      <label>
        Category
        <input name="category" required defaultValue="General" />
      </label>
      <label>
        Summary
        <textarea name="summary" required maxLength={500} />
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
        <select name="status" defaultValue="draft">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <button type="submit" className="btn">
        Save article
      </button>
    </form>
  );
}
