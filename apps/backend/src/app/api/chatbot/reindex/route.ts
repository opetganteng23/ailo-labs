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
import { Device } from "@/models/Device";
import { Book, Partner, Service } from "@/models/catalog";
import { KnowledgeDoc } from "@/models/KnowledgeDoc";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 800;

function chunkText(text: string): string[] {
  const clean = text.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [clean];
}

/** Long reference text is split on paragraph boundaries (about 700 characters) so an answer never starts mid-sentence. */
function chunkParagraphs(title: string, text: string): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const para of text.split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean)) {
    if (current && current.length + para.length > 700) {
      chunks.push(current);
      current = "";
    }
    current = current ? `${current} ${para}` : para;
    while (current.length > 1000) {
      const cut = current.lastIndexOf(". ", 900);
      const at = cut > 300 ? cut + 1 : 900;
      chunks.push(current.slice(0, at).trim());
      current = current.slice(at).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks.map((c) => `${title}\n${c}`);
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
    // Services, books and partners are always part of the chatbot's knowledge.
    const enabled = new Set([...(settings?.chatbot?.knowledgeSources ?? ["news", "research", "project", "team", "lab"]), "service", "book", "partner"]);

    const [news, research, projects, team, labs, devices, services, books, partners, knowledge] = await Promise.all([
      enabled.has("news") ? News.find({ status: "published" }).lean() : [],
      enabled.has("research") ? Research.find({ status: "published" }).lean() : [],
      enabled.has("project") ? Project.find({ publishStatus: { $nin: ["review", "archived"] } }).lean() : [],
      enabled.has("team") ? Team.find({ isActive: true }).lean() : [],
      enabled.has("lab") ? Lab.find({ isActive: true }).lean() : [],
      enabled.has("lab") ? Device.find().lean() : [],
      Service.find({ status: "published" }).lean(),
      Book.find({ status: "published" }).lean(),
      Partner.find({ status: "published" }).lean(),
      KnowledgeDoc.find({ status: "published" }).lean(),
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
      for (const chunk of chunkText(`${t.name} - ${t.position}\n${(t.categories?.length ? t.categories : [t.category]).filter(Boolean).join(", ")}\n${t.bio ?? ""}`)) {
        docs.push({ sourceType: "team", sourceId: t._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const l of labs) {
      const labDevices = devices
        .filter((d) => String(d.lab) === String(l._id))
        .map((d) => `${d.name}${d.specification ? ` (${d.specification})` : ""}`)
        .join("; ");
      const details = [
        l.location && `Location: ${l.location}`,
        l.capacity && `Capacity: ${l.capacity} people`,
        l.facilities && `Facilities: ${l.facilities}`,
        labDevices && `Equipment: ${labDevices}`,
      ]
        .filter(Boolean)
        .join("\n");
      for (const chunk of chunkText(`${l.name}\n${l.description ?? ""}\n${details}`)) {
        docs.push({ sourceType: "lab", sourceId: l._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const sv of services) {
      for (const chunk of chunkText(`Service: ${sv.title}\n${sv.description ?? ""}\n${sv.content ?? ""}`)) {
        docs.push({ sourceType: "service", sourceId: sv._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const b of books) {
      const meta = [b.author && `Author: ${b.author}`, b.year && `Year: ${b.year}`, b.link && `Link: ${b.link}`].filter(Boolean).join(", ");
      for (const chunk of chunkText(`Book: ${b.title}\n${meta}\n${b.description ?? ""}`)) {
        docs.push({ sourceType: "book", sourceId: b._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }
    for (const pt of partners) {
      for (const chunk of chunkText(`Partner (mitra kerja sama): ${pt.title}\n${pt.description ?? ""}${pt.link ? `\nWebsite: ${pt.link}` : ""}`)) {
        docs.push({ sourceType: "partner", sourceId: pt._id, chunkText: chunk, embedding: placeholderVector(chunk) });
      }
    }

    for (const k of knowledge) {
      for (const chunk of chunkParagraphs(k.title, k.content)) {
        docs.push({ sourceType: "knowledge", sourceId: k._id, chunkText: chunk, embedding: placeholderVector(chunk) });
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
