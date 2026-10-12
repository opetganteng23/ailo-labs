"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Floating reader toolbar pinned to the right edge of content detail pages
 * (News, Research, Projects, Books, Services, Labs, Team): share buttons,
 * device share sheet, bookmark, text size, read-aloud and a dark reading mode.
 *
 * Visitors have no account here, so bookmarks, text size and dark mode are
 * remembered in localStorage only (per browser). Read-aloud uses the browser's
 * own speech synthesis - no server or third-party voice service involved.
 */

const SCALES = [0.9, 1, 1.1, 1.2, 1.35, 1.5];
const DEFAULT_SCALE = 1;
const FONT_KEY = "reader:fontStep";
const DARK_KEY = "reader:dark";
const BOOKMARK_KEY = "reader:bookmarks";

type Bookmark = { url: string; title: string; savedAt: number };

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode etc.) - the setting just won't survive a reload.
  }
}

function loadBookmarks(): Bookmark[] {
  try {
    const parsed = JSON.parse(readStorage(BOOKMARK_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((b) => b && typeof b.url === "string" && typeof b.title === "string") : [];
  } catch {
    return [];
  }
}

/** Plain text of the page's <main>, one block per line, minus anything marked data-reader-skip. */
function readableText(): string {
  const main = document.querySelector("main");
  if (!main) return "";
  const clone = main.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-reader-skip], button, script, style, noscript, svg, iframe").forEach((el) => el.remove());
  clone.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, tr, div, br, figcaption").forEach((el) => el.append("\n"));
  return clone.textContent ?? "";
}

/** Split into utterances of at most ~220 chars on sentence boundaries - Chrome stops long utterances after ~15s. */
function chunkText(text: string): string[] {
  const out: string[] = [];
  for (const block of text.split(/\n+/).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean)) {
    const sentences = block.match(/[^.!?]+[.!?]*\s*/g) ?? [block];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > 220 && current) {
        out.push(current.trim());
        current = "";
      }
      current += s;
    }
    if (current.trim()) out.push(current.trim());
  }
  return out;
}

const Icon = ({ children, filled }: { children: ReactNode; filled?: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const icons = {
  whatsapp: (
    <Icon>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Icon>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  telegram: (
    <Icon>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </Icon>
  ),
  instagram: (
    <Icon>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Icon>
  ),
  link: (
    <Icon>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  ),
  share: (
    <Icon>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </Icon>
  ),
  plus: (
    <Icon>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icon>
  ),
  minus: (
    <Icon>
      <path d="M5 12h14" />
    </Icon>
  ),
  speaker: (
    <Icon>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Icon>
  ),
  stop: (
    <Icon filled>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Icon>
  ),
  moon: (
    <Icon>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Icon>
  ),
  sun: (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Icon>
  ),
  close: (
    <Icon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  ),
};

const bookmarkIcon = (filled: boolean) => (
  <Icon filled={filled}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </Icon>
);

export function ReaderToolbar({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [dark, setDark] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Restore saved preferences once on mount; undo page-level changes on unmount
  // so client-side navigation away (e.g. Back to the homepage) doesn't keep them.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values (URL, storage) read after hydration
    setUrl(window.location.href);
    setCanSpeak("speechSynthesis" in window);
    setBookmarks(loadBookmarks());
    const savedScale = Number(readStorage(FONT_KEY));
    if (SCALES.includes(savedScale)) setScale(savedScale);
    if (readStorage(DARK_KEY) === "1") setDark(true);
    return () => {
      document.documentElement.classList.remove("reader-dark");
      const main = document.querySelector("main");
      if (main) {
        main.style.removeProperty("zoom");
        main.style.removeProperty("width");
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (scale === DEFAULT_SCALE) {
      main.style.removeProperty("zoom");
      main.style.removeProperty("width");
    } else {
      // zoom also scales the box, so shrink the layout width to match - otherwise
      // a zoomed <main> spills past the viewport on phones.
      main.style.setProperty("zoom", String(scale));
      main.style.setProperty("width", `calc(100% / ${scale})`);
    }
  }, [scale]);

  useEffect(() => {
    document.documentElement.classList.toggle("reader-dark", dark);
  }, [dark]);

  function changeScale(dir: 1 | -1) {
    const next = SCALES[SCALES.indexOf(scale) + dir];
    if (next === undefined) return;
    setScale(next);
    writeStorage(FONT_KEY, next === DEFAULT_SCALE ? null : String(next));
    flash(`Ukuran teks ${Math.round(next * 100)}%`);
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    writeStorage(DARK_KEY, next ? "1" : null);
  }

  async function copyLink(message = "Tautan disalin") {
    try {
      await navigator.clipboard.writeText(url);
      flash(message);
    } catch {
      flash("Gagal menyalin tautan");
    }
  }

  async function nativeShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // User closed the share sheet - nothing to do.
      }
      return;
    }
    copyLink();
  }

  function toggleSpeak() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const chunks = chunkText(readableText());
    if (!chunks.length) return;
    synth.cancel();
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("id"));
    chunks.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      if (voice) u.voice = voice;
      if (i === chunks.length - 1) {
        u.onend = () => setSpeaking(false);
      }
      u.onerror = () => setSpeaking(false);
      synth.speak(u);
    });
    setSpeaking(true);
  }

  const saved = bookmarks.some((b) => b.url === url);

  function toggleBookmark() {
    const next = saved ? bookmarks.filter((b) => b.url !== url) : [{ url, title, savedAt: Date.now() }, ...bookmarks].slice(0, 50);
    setBookmarks(next);
    writeStorage(BOOKMARK_KEY, JSON.stringify(next));
    flash(saved ? "Dihapus dari simpanan" : "Disimpan di perangkat ini");
  }

  function removeBookmark(target: string) {
    const next = bookmarks.filter((b) => b.url !== target);
    setBookmarks(next);
    writeStorage(BOOKMARK_KEY, JSON.stringify(next));
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className={`reader-toolbar${mobileOpen ? " is-open" : ""}`} data-reader-keep data-reader-skip>
      <div className="reader-toolbar-stack" role="toolbar" aria-label="Alat baca dan bagikan">
        <a className="rt-btn dark" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke WhatsApp" title="Bagikan ke WhatsApp">
          {icons.whatsapp}
        </a>
        <a className="rt-btn dark" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke X" title="Bagikan ke X">
          {icons.x}
        </a>
        <a className="rt-btn dark" href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" aria-label="Bagikan ke Telegram" title="Bagikan ke Telegram">
          {icons.telegram}
        </a>
        {/* Instagram has no web share-intent for links, so this copies the link to paste into a story/DM. */}
        <button type="button" className="rt-btn dark" onClick={() => copyLink("Tautan disalin - tempel di Instagram")} aria-label="Bagikan ke Instagram" title="Bagikan ke Instagram (salin tautan)">
          {icons.instagram}
        </button>
        <button type="button" className="rt-btn dark" onClick={() => copyLink()} aria-label="Salin tautan" title="Salin tautan">
          {icons.link}
        </button>

        <button type="button" className="rt-btn" onClick={nativeShare} aria-label="Bagikan" title="Bagikan">
          {icons.share}
        </button>
        <div className="rt-bookmark">
          <button
            type="button"
            className={`rt-btn${saved ? " active" : ""}`}
            onClick={toggleBookmark}
            aria-pressed={saved}
            aria-label={saved ? "Hapus dari simpanan" : "Simpan halaman ini"}
            title={saved ? "Hapus dari simpanan" : "Simpan halaman ini"}
          >
            {bookmarkIcon(saved)}
          </button>
          {bookmarks.length > 0 && (
            <button type="button" className="rt-badge" onClick={() => setShowSaved((v) => !v)} aria-label={`Lihat ${bookmarks.length} halaman tersimpan`} title="Lihat halaman tersimpan">
              {bookmarks.length}
            </button>
          )}
          {showSaved && (
            <div className="rt-saved" role="dialog" aria-label="Halaman tersimpan">
              <div className="rt-saved-head">
                <strong>Tersimpan di perangkat ini</strong>
                <button type="button" onClick={() => setShowSaved(false)} aria-label="Tutup">
                  {icons.close}
                </button>
              </div>
              {bookmarks.length === 0 ? (
                <p className="rt-saved-empty">Belum ada halaman tersimpan.</p>
              ) : (
                <ul>
                  {bookmarks.map((b) => (
                    <li key={b.url}>
                      <a href={b.url}>{b.title}</a>
                      <button type="button" onClick={() => removeBookmark(b.url)} aria-label={`Hapus ${b.title}`}>
                        {icons.close}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button type="button" className="rt-btn" onClick={() => changeScale(1)} disabled={scale === SCALES[SCALES.length - 1]} aria-label="Perbesar teks" title="Perbesar teks">
          {icons.plus}
        </button>
        <button type="button" className="rt-btn" onClick={() => changeScale(-1)} disabled={scale === SCALES[0]} aria-label="Perkecil teks" title="Perkecil teks">
          {icons.minus}
        </button>
        {canSpeak && (
          <button type="button" className={`rt-btn${speaking ? " active" : ""}`} onClick={toggleSpeak} aria-pressed={speaking} aria-label={speaking ? "Berhenti membacakan" : "Dengarkan halaman ini"} title={speaking ? "Berhenti membacakan" : "Dengarkan"}>
            {speaking ? icons.stop : icons.speaker}
          </button>
        )}
        <button type="button" className={`rt-btn${dark ? " active" : ""}`} onClick={toggleDark} aria-pressed={dark} aria-label={dark ? "Mode terang" : "Mode gelap"} title={dark ? "Mode terang" : "Mode gelap"}>
          {dark ? icons.sun : icons.moon}
        </button>
      </div>

      <button type="button" className="rt-btn dark rt-toggle" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Tutup alat baca" : "Buka alat baca"}>
        {mobileOpen ? icons.close : icons.share}
      </button>

      {toast && (
        <div className="rt-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
