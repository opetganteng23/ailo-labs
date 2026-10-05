/** Homepage class names are all prefixed `hm-` (see home.css) so they can never collide with the rest of the site's styles. */
export function hm(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => `hm-${c}`)
    .join(" ");
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Inline style a section needs when it carries a background layer. */
export function bgSectionStyle(images?: string[]) {
  return (images ?? []).filter(Boolean).length > 0 ? ({ position: "relative", overflow: "hidden" } as const) : undefined;
}
