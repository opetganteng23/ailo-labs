"use client";

import { useEffect, useState } from "react";

import { TagInput } from "./TagInput";

/** Free-form categories for an item; suggestions are the categories already in use for that kind of content. Submitted comma-separated as "categories". */
export function CategoryField({ kind, defaultValue = [] }: { kind: "news" | "research" | "project" | "service"; defaultValue?: string[] }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    fetch(`/api/categories?kind=${kind}`)
      .then((r) => r.json())
      .then((j) => alive && j.success && setSuggestions(j.data.categories))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [kind]);
  return (
    <div className="admin2-field">
      <TagInput name="categories" defaultValue={defaultValue} suggestions={suggestions} max={8} placeholder="Add a category, press Enter" />
      <span style={{ fontSize: 12.5, color: "#6b7573" }}>An item can have several categories.</span>
    </div>
  );
}
