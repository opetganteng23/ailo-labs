import { connectToDatabase } from "@/lib/mongodb";
import { ChatEmbedding } from "@/models/ChatEmbedding";
import { SiteSettings } from "@/models/SiteSettings";

import { ChatbotTabs } from "../ChatbotTabs";
import { ModelSettingsForm } from "../ModelSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminChatbotModelPage() {
  await connectToDatabase();

  const [settingsDoc, chunkCount] = await Promise.all([
    SiteSettings.findOne({ key: "global" }).lean<{
      chatbot?: {
        provider?: string;
        apiKeyEncrypted?: string;
        apiKeyLast4?: string;
        baseUrl?: string;
        chatModel?: string;
        embeddingModel?: string;
        temperature?: number;
        maxTokens?: number;
        topK?: number;
        systemPrompt?: string;
        fallbackReply?: string;
        monthlyTokenBudget?: number;
        perVisitorDailyLimit?: number;
        tokensUsedThisMonth?: number;
        knowledgeSources?: string[];
      };
    }>(),
    ChatEmbedding.countDocuments(),
  ]);

  const chatbot = settingsDoc?.chatbot ?? {};
  const hasApiKey = !!chatbot.apiKeyEncrypted;

  const checklist = [
    { label: "Knowledge sources chosen", done: (chatbot.knowledgeSources?.length ?? 0) > 0 },
    { label: "API key connected", done: hasApiKey },
    { label: "Embedding model selected", done: !!chatbot.embeddingModel },
    { label: "Knowledge re-indexed", done: chunkCount > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Chatbot</h1>
          <p>Decide what the public assistant knows, which AI model answers, and test it before visitors do.</p>
        </div>
      </div>

      <ChatbotTabs active="model" apiKeyMissing={!hasApiKey} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <ModelSettingsForm
            settings={{
              provider: chatbot.provider ?? "openai",
              hasApiKey,
              apiKeyLast4: chatbot.apiKeyLast4,
              baseUrl: chatbot.baseUrl ?? "",
              chatModel: chatbot.chatModel ?? "",
              embeddingModel: chatbot.embeddingModel ?? "",
              temperature: chatbot.temperature ?? 0.3,
              maxTokens: chatbot.maxTokens ?? 800,
              topK: chatbot.topK ?? 5,
              systemPrompt: chatbot.systemPrompt ?? "",
              fallbackReply: chatbot.fallbackReply ?? "",
              monthlyTokenBudget: chatbot.monthlyTokenBudget,
              perVisitorDailyLimit: chatbot.perVisitorDailyLimit ?? 20,
              tokensUsedThisMonth: chatbot.tokensUsedThisMonth ?? 0,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="admin2-section pad-sm">
            <div style={{ display: "flex", alignItems: "center" }}>
              <h2>Go-live checklist</h2>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#7a4a12" }}>
                {doneCount} / {checklist.length}
              </span>
            </div>
            <ul className="admin2-checklist">
              {checklist.map((c) => (
                <li key={c.label} className={c.done ? "done" : ""}>
                  {c.done ? (
                    <span className="dot-done">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </span>
                  ) : (
                    <span className="dot-todo" />
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
