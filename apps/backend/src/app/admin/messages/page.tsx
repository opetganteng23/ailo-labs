import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";

import { deleteMessageAction, markMessageReadAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  await connectToDatabase();
  const messages = (await ContactMessage.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];

  return (
    <div>
      <h1>Contact messages</h1>
      <p style={{ fontSize: 13, color: "#5b6469" }}>Messages submitted through the public contact form.</p>

      {messages.length === 0 && (
        <p className="notice" style={{ marginTop: 24 }}>
          No messages yet.
        </p>
      )}

      <div className="stack" style={{ marginTop: 24, maxWidth: 720 }}>
        {messages.map((m) => (
          <div
            key={m._id}
            style={{
              border: "1px solid var(--line)",
              padding: 16,
              opacity: m.isRead ? 0.7 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>{m.subject}</strong>
              {!m.isRead && <span className="badge">New</span>}
            </div>
            <p style={{ fontSize: 13, color: "#5b6469", margin: "4px 0" }}>
              {m.name} &lt;{m.email}&gt; &middot; {new Date(m.createdAt).toLocaleString()}
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{m.message}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <form action={markMessageReadAction}>
                <input type="hidden" name="id" value={m._id} />
                <input type="hidden" name="isRead" value={(!m.isRead).toString()} />
                <button type="submit" className="btn outline">
                  {m.isRead ? "Mark as unread" : "Mark as read"}
                </button>
              </form>
              <form action={deleteMessageAction}>
                <input type="hidden" name="id" value={m._id} />
                <button type="submit" className="btn danger">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
