"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { toast } from "@/lib/toast";

import { replyMessageAction, type ReplyState } from "./actions";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin2-btn" style={{ alignSelf: "flex-end" }} disabled={pending} aria-busy={pending}>
      {pending && <span className="btn-spinner" aria-hidden="true" />}
      {pending ? "Sending…" : "Send reply"}
    </button>
  );
}

const fmt = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Reply box with visible sending / sent / failed states (§5). */
export function ReplyForm({ id, to, subject }: { id: string; to: string; subject: string }) {
  const [state, formAction] = useActionState<ReplyState, FormData>(replyMessageAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "sent") {
      formRef.current?.reset();
      toast("success", "Reply berhasil dikirim.");
      router.refresh(); // status pill + timeline
    } else if (state.status === "error") {
      toast("error", state.message ?? "Reply gagal dikirim.");
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} style={{ padding: 20, borderTop: "1px solid #eeece6", background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="subject" value={subject} />

      {state.status === "sent" && state.sentAt && (
        <div className="reply-result sent" role="status">
          <strong>Reply berhasil dikirim.</strong>
          <span>
            Recipient: <b>{state.to}</b>
          </span>
          <span>
            Status: <b>✓ Sent</b>
          </span>
          <span>
            Sent: <b>{fmt(state.sentAt)}</b>
          </span>
        </div>
      )}
      {state.status === "error" && (
        <div className="reply-result error" role="alert">
          <strong>Reply gagal dikirim.</strong>
          <span>{state.message ?? "Silakan coba kembali."}</span>
        </div>
      )}

      <label htmlFor="reply-body" style={{ fontSize: 13, fontWeight: 600, color: "#5b6664" }}>
        Reply to {to}
      </label>
      <textarea id="reply-body" name="body" rows={4} placeholder="Type your reply…" required />
      <SendButton />
    </form>
  );
}
