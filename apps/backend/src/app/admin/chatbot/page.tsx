import Link from "next/link";

import { connectToDatabase } from "@/lib/mongodb";
import { ChatbotQA } from "@/models/ChatbotQA";
import { ChatEmbedding } from "@/models/ChatEmbedding";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { SiteSettings } from "@/models/SiteSettings";
import { Team } from "@/models/Team";
import { Lab } from "@/models/Lab";

import { ChatbotTabs } from "./ChatbotTabs";
import { ChatPreview } from "./ChatPreview";
import { KnowledgeSourcesForm } from "./KnowledgeSourcesForm";
import { QAList } from "./QAList";
import { ReindexButton } from "./ReindexButton";

export const dynamic = "force-dynamic";

export default async function AdminChatbotPage() {
  await connectToDatabase();

  const [chunkCount, settings, qaItems, newsCount, newsPublished, researchPublished, projectCount, teamCount, labCount, lastIndexed] =
    await Promise.all([
      ChatEmbedding.countDocuments(),
      SiteSettings.findOne({ key: "global" }).lean<{
        chatbot?: {
          knowledgeSources?: string[];
          apiKeyEncrypted?: string;
          apiKeyLast4?: string;
        };
      }>(),
      ChatbotQA.find().sort({ createdAt: -1 }).lean<{ _id: string; question: string; answer: string }[]>(),
      News.countDocuments(),
      News.countDocuments({ status: "published" }),
      Research.countDocuments({ status: "published" }),
      Project.countDocuments(),
      Team.countDocuments({ isActive: true }),
      Lab.countDocuments({ isActive: true }),
      ChatEmbedding.findOne().sort({ updatedAt: -1 }).lean<{ updatedAt?: Date }>(),
    ]);

  const enabledSources = settings?.chatbot?.knowledgeSources ?? ["news", "research", "project", "team", "lab"];
  const hasApiKey = !!settings?.chatbot?.apiKeyEncrypted;

  const counts: Record<string, string> = {
    news: `${newsCount} article${newsCount === 1 ? "" : "s"} · ${newsPublished} published`,
    research: `${researchPublished} published`,
    project: `${projectCount} project${projectCount === 1 ? "" : "s"}`,
    team: `${teamCount} member profile${teamCount === 1 ? "" : "s"}`,
    lab: `${labCount} lab${labCount === 1 ? "" : "s"}`,
  };

  const stepsLeft = [!hasApiKey && "Add API key", chunkCount === 0 && "Re-index knowledge"].filter(Boolean) as string[];

  return (
    <div>
      <div className="admin2-header">
        <div>
          <h1>Chatbot</h1>
          <p>Decide what the public assistant knows, which AI model answers, and test it before visitors do.</p>
        </div>
        <div className="admin2-actions">
          <ReindexButton />
        </div>
      </div>

      <ChatbotTabs active="knowledge" apiKeyMissing={!hasApiKey} />

      {stepsLeft.length > 0 && (
        <div className="admin2-banner">
          <div className="admin2-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l9.5 17H2.5z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
            <strong>The chatbot can&apos;t answer visitors yet</strong>
            <span className="sub">
              {!hasApiKey && chunkCount === 0
                ? "No AI model is connected and nothing is indexed."
                : !hasApiKey
                  ? "No AI model is connected."
                  : "Nothing is indexed yet."}{" "}
              {stepsLeft.length} step{stepsLeft.length === 1 ? "" : "s"} left to go live.
            </span>
          </div>
          <div className="admin2-banner-steps">
            {stepsLeft.map((step, i) => (
              <span key={step}>
                {i + 1} · {step}
              </span>
            ))}
          </div>
          <Link href="/admin/chatbot/model" className="admin2-banner-cta">
            Connect a model
          </Link>
        </div>
      )}

      <div className="admin2-stat-grid">
        <div className="admin2-stat-card">
          <span>Indexed chunks</span>
          <span>{chunkCount}</span>
        </div>
        <div className="admin2-stat-card">
          <span>Knowledge sources</span>
          <span>
            {enabledSources.length} <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7573" }}>collections</span>
          </span>
        </div>
        <div className="admin2-stat-card">
          <span>Last indexed</span>
          <span style={{ fontSize: lastIndexed?.updatedAt ? 20 : 28 }}>
            {lastIndexed?.updatedAt ? new Date(lastIndexed.updatedAt).toLocaleString("en-GB") : "Never"}
          </span>
        </div>
        <div className="admin2-stat-card">
          <span>Embeddings</span>
          <span style={{ fontSize: 16, color: "#7a4a12", paddingTop: 8 }}>{hasApiKey ? "Live" : "Placeholder (hash)"}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <section className="admin2-panel">
            <div className="admin2-panel-toolbar">
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Website content</h2>
                <p style={{ margin: 0, fontSize: 14, color: "#5b6664" }}>Synced automatically. Only published items are indexed.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0b454c", background: "#e3f1f1", borderRadius: 999, padding: "5px 10px" }}>
                Auto-sync on publish
              </span>
            </div>
            <KnowledgeSourcesForm enabled={enabledSources} counts={counts} />
          </section>

          <section className="admin2-section">
            <QAList items={qaItems} />
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ChatPreview />
        </div>
      </div>
    </div>
  );
}
