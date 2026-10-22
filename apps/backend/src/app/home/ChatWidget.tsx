"use client";

import { useEffect, useRef, useState } from "react";

import { hm } from "./util";

type Bubble = { who: "bot" | "user"; text: string; suggestions?: string[] };

/** The floating "Ask AILO" chatbot: a button that opens a small panel talking to /api/chatbot/ask. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      who: "bot",
      text: "Halo! Saya Ask AILO, asisten virtual CoE AILO Telkom University. Mau tahu tentang apa?",
      suggestions: ["Berita terbaru", "Tim di balik AILO", "Layanan AILO", "Cara booking lab"],
    },
  ]);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [bubbles]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  async function ask(message: string) {
    if (!message || busy) return;
    // Options under earlier answers go stale once the visitor moves on, so only the newest reply keeps its buttons.
    setBubbles((b) => [...b.map((x) => ({ ...x, suggestions: undefined })), { who: "user", text: message }]);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/chatbot/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const data = await res.json();
      setBubbles((b) => [
        ...b,
        data.data
          ? { who: "bot", text: data.data.answer, suggestions: data.data.suggestions }
          : { who: "bot", text: "Maaf, terjadi kesalahan. Coba lagi sebentar lagi." },
      ]);
    } catch {
      setBubbles((b) => [...b, { who: "bot", text: "Maaf, tidak bisa terhubung ke server sekarang." }]);
    } finally {
      setBusy(false);
      window.setTimeout(() => input.current?.focus(), 0);
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    void ask(text.trim());
  }

  return (
    <>
      <div className={hm("fab-panel chat-mock")} id="fabPanel" hidden={!open}>
        <div className={hm("chead")}>
          <span className={hm("icon")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4" />
            </svg>
          </span>
          <div className={hm("titles")}>
            <b>Ask AILO</b>
            <span className={hm("status")}>
              <span className={hm("pulse")} />
              Online
            </span>
          </div>
        </div>
        <div className={hm("cbody")} id="fabBody" ref={body}>
          {bubbles.map((b, i) => (
            <div key={i} className={hm(`bubble-group ${b.who}`)}>
              <div className={hm(`bubble ${b.who}`)}>{b.text}</div>
              {b.suggestions && b.suggestions.length > 0 && (
                <div className={hm("chips")}>
                  {b.suggestions.map((option) => (
                    <button key={option} type="button" className={hm("chip")} disabled={busy} onClick={() => void ask(option)}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <div className={hm("bubble bot typing")}>Mengetik...</div>}
        </div>
        <form className={hm("cfoot")} id="fabForm" onSubmit={send}>
          <input ref={input} type="text" id="fabInput" placeholder="Tanyakan sesuatu tentang AILO..." autoComplete="off" value={text} disabled={busy} onChange={(e) => setText(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
      <button type="button" className={hm("fab")} id="fabToggle" aria-label="Open AILO chatbot" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <div className={hm("fab-pulse")} />
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.1-.2-3-.6L4 20l1.2-4.6c-.8-1-1.2-2.1-1.2-3.4z" stroke="white" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="8.5" cy="12" r="1" fill="white" />
          <circle cx="12" cy="12" r="1" fill="white" />
          <circle cx="15.5" cy="12" r="1" fill="white" />
        </svg>
      </button>
    </>
  );
}
