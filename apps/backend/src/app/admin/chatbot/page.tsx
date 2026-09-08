import { connectToDatabase } from "@/lib/mongodb";
import { ChatEmbedding } from "@/models/ChatEmbedding";

import { ReindexButton } from "./ReindexButton";

export const dynamic = "force-dynamic";

export default async function AdminChatbotPage() {
  await connectToDatabase();
  const count = await ChatEmbedding.countDocuments();

  return (
    <div>
      <h1>Chatbot</h1>
      <p style={{ fontSize: 13, color: "#5b6469", maxWidth: 560 }}>
        Re-indexing chunks published news, research, projects, team, and lab content into the ChatEmbedding
        collection. TODO: swap the placeholder hash-based vectors for real embeddings once an embedding-model API
        key is configured, and connect a real LLM for answer generation (RAG) once available.
      </p>
      <p style={{ marginTop: 16 }}>Currently indexed chunks: {count}</p>
      <div style={{ marginTop: 16 }}>
        <ReindexButton />
      </div>
    </div>
  );
}
