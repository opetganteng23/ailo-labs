import Link from "next/link";

import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { SiteSettings } from "@/models/SiteSettings";

import { archiveMessageAction, deleteMessageAction, markMessageReadAction } from "./actions";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

type Message = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  archived: boolean;
  repliedAt?: string;
  replies?: { body: string; sentAt: string; sentBy?: string; to?: string }[];
  createdAt: string;
};

// Message lifecycle (§6): NEW -> OPENED -> REPLIED -> CLOSED.
type MsgStatus = "new" | "opened" | "replied" | "closed";
const statusOf = (m: Message): MsgStatus => (m.archived ? "closed" : m.repliedAt ? "replied" : m.isRead ? "opened" : "new");
const STATUS_LABEL: Record<MsgStatus, string> = { new: "New", opened: "Opened", replied: "Replied", closed: "Closed" };

const TABS = ["all", "new", "opened", "replied", "closed"] as const;

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; id?: string }>;
}) {
  const { tab, q, id } = await searchParams;
  const currentTab = TABS.includes(tab as (typeof TABS)[number]) ? (tab as (typeof TABS)[number]) : "all";

  await connectToDatabase();
  const [all, settings] = await Promise.all([
    ContactMessage.find().sort({ createdAt: -1 }).lean<Message[]>(),
    SiteSettings.findOne({ key: "global" }).lean<{ contact?: { email?: string } }>(),
  ]);

  // Replies are sent through the mail account, so show that address.
  const replyFrom = process.env.APP_EMAIL || settings?.contact?.email || "ailo@telkomuniversity.ac.id";

  const query = (q ?? "").toLowerCase().trim();
  const filtered = all
    .filter((m) => currentTab === "all" || statusOf(m) === currentTab)
    .filter((m) => !query || `${m.name} ${m.email} ${m.subject}`.toLowerCase().includes(query));

  const counts: Record<(typeof TABS)[number], number> = {
    all: all.length,
    new: all.filter((m) => statusOf(m) === "new").length,
    opened: all.filter((m) => statusOf(m) === "opened").length,
    replied: all.filter((m) => statusOf(m) === "replied").length,
    closed: all.filter((m) => statusOf(m) === "closed").length,
  };

  const selected = id ? all.find((m) => String(m._id) === id) : filtered[0];
  // Opening a message (clicking it in the list) marks it read.
  if (id && selected && !selected.isRead) {
    await ContactMessage.findByIdAndUpdate(selected._id, { isRead: true });
    selected.isRead = true;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em" }}>Messages</h1>
        <p style={{ margin: "4px 0 0", fontSize: 15, color: "#5b6664" }}>
          Messages visitors send from the{" "}
          <a href="/contact" target="_blank" rel="noopener noreferrer" style={{ color: "#00809d", fontWeight: 600 }}>
            Contact form
          </a>{" "}
          on the public site (&quot;Contact us&quot; / &quot;Get in touch&quot;). Each message moves from <strong>New</strong> to <strong>Opened</strong> (when you open it), <strong>Replied</strong> and finally <strong>Closed</strong>. Replies are sent by email.
        </p>
      </div>

      <section style={{ background: "#fff", border: "1px solid #e3e1da", borderRadius: 16, overflow: "hidden", display: "flex", minHeight: 520 }}>
        <div style={{ width: 380, flexShrink: 0, borderRight: "1px solid #eeece6", display: "flex", flexDirection: "column" }}>
          <form action="/admin/messages" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, borderBottom: "1px solid #eeece6" }}>
            <input type="hidden" name="tab" value={currentTab} />
            <input type="search" name="q" defaultValue={q} aria-label="Search messages" placeholder="Search name, email, subject…" style={{ height: 42 }} />
          </form>
          <div style={{ display: "flex", gap: 4, padding: "0 16px 16px", borderBottom: "1px solid #eeece6", flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <Link
                key={t}
                href={`/admin/messages?tab=${t}${q ? `&q=${q}` : ""}`}
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 8,
                  background: currentTab === t ? "#e3f1f1" : "transparent",
                  color: currentTab === t ? "#0b454c" : "#4e5957",
                  fontSize: 13,
                  fontWeight: currentTab === t ? 700 : 600,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {t === "all" ? "All" : STATUS_LABEL[t]} {counts[t]}
              </Link>
            ))}
          </div>

          <div style={{ flexGrow: 1, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#6b7573" }}>
                Nothing in the {currentTab}
              </div>
            )}
            {filtered.map((m) => (
              <a
                key={m._id}
                href={`/admin/messages?tab=${currentTab}${q ? `&q=${q}` : ""}&id=${m._id}`}
                style={{
                  display: "block",
                  padding: "14px 16px",
                  borderBottom: "1px solid #eeece6",
                  background: selected?._id === m._id ? "#f2f9f9" : "transparent",
                  textDecoration: "none",
                  color: "#15201f",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: m.isRead ? 600 : 800 }}>{m.name}</span>
                  {!m.isRead && <span style={{ width: 8, height: 8, borderRadius: 999, background: "#d9731f", flexShrink: 0, marginTop: 5 }} />}
                </div>
                <span style={{ display: "block", fontSize: 13, fontWeight: m.isRead ? 500 : 700, color: "#3b4947", marginTop: 2 }}>{m.subject}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7573", marginTop: 4 }}>
                  {new Date(m.createdAt).toLocaleString("en-GB")}
                  <span className={`msg-status ${statusOf(m)}`}>{STATUS_LABEL[statusOf(m)]}</span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", background: "#fbfaf7" }}>
          {!selected ? (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40, textAlign: "center" }}>
              <span style={{ width: 64, height: 64, borderRadius: 18, background: "#e3f1f1", color: "#0e6b73", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16v12H4z" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
              </span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>No messages yet</h2>
              <p style={{ margin: 0, maxWidth: 400, fontSize: 14, lineHeight: 1.55, color: "#5b6664" }}>
                Pick a message on the left to read it. From here you can reply by email, mark it handled, or archive it.
              </p>
              <span style={{ fontSize: 13, color: "#6b7573" }}>
                Replies go out from <strong style={{ color: "#15201f" }}>{replyFrom}</strong>
              </span>
            </div>
          ) : (
            <>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid #eeece6", background: "#fff", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flexGrow: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selected.subject}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5b6664" }}>
                    {selected.name} &lt;{selected.email}&gt; · {new Date(selected.createdAt).toLocaleString("en-GB")}
                  </p>
                  <p style={{ margin: "8px 0 0", display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "#5b6664" }}>
                    <span className="msg-source">Source: website contact form</span>
                    <span className={`msg-status ${statusOf(selected)}`}>{STATUS_LABEL[statusOf(selected)]}</span>
                  </p>
                </div>
                <form action={markMessageReadAction}>
                  <input type="hidden" name="id" value={selected._id} />
                  <input type="hidden" name="isRead" value={(!selected.isRead).toString()} />
                  <button type="submit" className="admin2-btn outline" style={{ height: 38, fontSize: 13 }}>
                    {selected.isRead ? "Mark unread" : "Mark read"}
                  </button>
                </form>
                <form action={archiveMessageAction}>
                  <input type="hidden" name="id" value={selected._id} />
                  <input type="hidden" name="archived" value={(!selected.archived).toString()} />
                  <button type="submit" className="admin2-btn outline" style={{ height: 38, fontSize: 13 }}>
                    {selected.archived ? "Reopen" : "Close"}
                  </button>
                </form>
                <form action={deleteMessageAction}>
                  <input type="hidden" name="id" value={selected._id} />
                  <ConfirmSubmit title="Delete this message?" message="The message will be permanently removed." confirmLabel="Delete" className="admin2-btn danger" style={{ height: 38, fontSize: 13 }}>
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>

              <div style={{ padding: 28, whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.6, color: "#22302e", flexGrow: 1 }}>{selected.message}</div>

              {(selected.replies?.length ?? 0) > 0 && (
                <div className="msg-timeline">
                  <span className="msg-timeline-title">Replies</span>
                  {selected.replies!.map((r, i) => (
                    <div key={i} className="msg-timeline-item">
                      <span className="msg-timeline-meta">
                        <b>{r.sentBy ?? "Admin"}</b> to {r.to ?? selected.email} · {new Date(r.sentAt).toLocaleString("en-GB")} · <span className="msg-status replied">Sent</span>
                      </span>
                      <span className="msg-timeline-body">{r.body}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected.archived ? (
                <p style={{ margin: 0, padding: 20, borderTop: "1px solid #eeece6", background: "#fff", fontSize: 14, color: "#5b6664" }}>
                  This conversation is closed. Reopen it to reply.
                </p>
              ) : (
                <ReplyForm key={String(selected._id)} id={String(selected._id)} to={selected.email} subject={selected.subject} />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
