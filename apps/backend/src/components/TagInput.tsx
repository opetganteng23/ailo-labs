"use client";

import { useId, useState } from "react";

/**
 * Chip-style tag entry: type and press Enter or comma, or pick a suggestion.
 * Submits the tags comma-separated in a hidden input under `name`.
 */
export function TagInput({
  name,
  defaultValue = [],
  suggestions = [],
  placeholder = "Add a tag…",
  max = 12,
}: {
  name: string;
  defaultValue?: string[];
  suggestions?: string[];
  placeholder?: string;
  max?: number;
}) {
  const listId = useId();
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [input, setInput] = useState("");

  function add(value: string) {
    const v = value.trim().replace(/\s+/g, " ").slice(0, 40);
    if (v && tags.length < max && !tags.some((t) => t.toLowerCase() === v.toLowerCase())) setTags((t) => [...t, v]);
    setInput("");
  }

  const available = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div className="tag-input-field">
      <input type="hidden" name={name} value={tags.join(",")} />
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
          type="text"
          list={listId}
          placeholder={tags.length >= max ? `Up to ${max} tags` : placeholder}
          disabled={tags.length >= max}
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            // Picking a datalist option fills the input in one go; accept it immediately.
            if (available.includes(v)) add(v);
            else setInput(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && tags.length) {
              setTags((ts) => ts.slice(0, -1));
            }
          }}
          onBlur={() => input && add(input)}
        />
        <datalist id={listId}>
          {available.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      {available.length > 0 && (
        <div className="tag-suggestions">
          {available.slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
