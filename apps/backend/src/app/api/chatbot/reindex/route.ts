import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ChatEmbedding } from "@/models/ChatEmbedding";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { SiteSettings } from "@/models/SiteSettings";
import { Team } from "@/models/Team";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 800;

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [clean];
}

/**
 * TODO: this generates a deterministic placeholder vector (hash-derived, not a
 * real embedding) because no embedding-model API key is configured. Swap this
 * for a real embedding call (e.g. an Anthropic/OpenAI embeddings endpoint)
 * once ANTHROPIC_API_KEY or similar is set, then re-run reindex.
 */
function placeholderVector(text: string, dims = 32): number[] {
  const hash = crypto.createHash("sha256").update(text).digest();
  return Array.from({ length: dims }, (_, i) => hash[i % hash.length] / 255);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();

    const settings = await SiteSettings.findOne({ key: "global" }).lean<{ chatbot?: { knowledgeSources?: string[] } }>();
    const enabled = new Set(settings?.chatbot?.knowledgeSources ?? ["news", "research", "project", "team", "lab"]);

    const [news, research, projects, team, labs] = await Promise.all([
      enabled.has("news") ? News.find({ status: "published" }).lean() : [],
      enabled.has("research") ? Research.find({ status: "published" }).lean() : [],
      enabled.has("project") ? Project.find({ publishStatus: { $ne: "review" } }).lean() : [],
      enabled.has("team") ? Team.find({ isActive: true }).lean() : [],
      enabled.has("lab") ? Lab.find({ isActive: true }).lean() : [],
    ]);

    await ChatEmbedding.deleteMany({});

    const docs: { sourceType: string; sourceId: unknown; chunkText: string; embedding: number[] }[] = [];

    for (const n of news) {
      for (const chunk of chunkText(`${n.title}\n${n.summary}\n${n.content}`)) {
        docs.push({ sourceType: "news", sourceId: n._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const r of research) {
      for (const chunk of chunkText(`${r.title}\n${r.description}\n${r.content}`)) {
        docs.push({ sourceType: "research", sourceId: r._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const p of projects) {
      for (const chunk of chunkText(`${p.title}\n${p.description}\n${p.content}`)) {
        docs.push({ sourceType: "project", sourceId: p._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const t of team) {
      for (const chunk of chunkText(`${t.name} - ${t.position}\n${t.bio ?? ""}`)) {
        docs.push({ sourceType: "team", sourceId: t._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const l of labs) {
      for (const chunk of chunkText(`${l.name}\n${l.description ?? ""}`)) {
        docs.push({ sourceType: "lab", sourceId: l._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }

    if (docs.length > 0) {
      await ChatEmbedding.insertMany(docs);
    }

    return NextResponse.json({ success: true, data: { chunksIndexed: docs.length } });
  } catch (error) {
    console.error("Failed to reindex chatbot content", error);
    return NextResponse.json({ success: false, error: "Unable to reindex." }, { status: 500 });
  }
}
