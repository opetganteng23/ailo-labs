/** Shared by the editor (live preview) and the public pages: wraps author-supplied HTML as a standalone document for a sandboxed iframe. */
export const EMBED_DEFAULT_HEIGHT = 420;
export const EMBED_MIN_HEIGHT = 80;
export const EMBED_MAX_HEIGHT = 1600;
export const EMBED_MAX_HTML = 100_000;

export function clampEmbedHeight(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return EMBED_DEFAULT_HEIGHT;
  return Math.min(EMBED_MAX_HEIGHT, Math.max(EMBED_MIN_HEIGHT, Math.round(n)));
}

export function buildEmbedDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0}body{font-family:Poppins,system-ui,sans-serif;color:#12181b}img,video,iframe{max-width:100%}</style></head><body>${html}</body></html>`;
}

/** Sandbox without allow-same-origin: scripts may run, but never see this site's cookies, storage or DOM. */
export const EMBED_SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation";
