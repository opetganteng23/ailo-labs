import Link from "next/link";

export function ChatbotTabs({ active, apiKeyMissing }: { active: "knowledge" | "documents" | "model"; apiKeyMissing: boolean }) {
  return (
    <div className="admin2-editor-tabs" role="tablist" aria-label="Chatbot sections">
      <Link href="/admin/chatbot" role="tab" aria-selected={active === "knowledge"} className={active === "knowledge" ? "active" : ""}>
        Knowledge
      </Link>
      <Link href="/admin/chatbot/documents" role="tab" aria-selected={active === "documents"} className={active === "documents" ? "active" : ""}>
        Documents
      </Link>
      <Link href="/admin/chatbot/model" role="tab" aria-selected={active === "model"} className={active === "model" ? "active" : ""}>
        AI model &amp; API key
        {apiKeyMissing && <span className="admin2-tab-dot" />}
      </Link>
    </div>
  );
}
