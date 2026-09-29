import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { ChatbotQA } from "@/models/ChatbotQA";
import { ChatEmbedding } from "@/models/ChatEmbedding";

export const dynamic = "force-dynamic";

const askSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

const STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "apa", "apakah", "adalah", "itu", "ini",
  "the", "a", "an", "is", "are", "of", "to", "for", "and", "what", "how", "do", "does",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * TODO: this is keyword-overlap scoring, not real semantic retrieval, because
 * no embedding-model API key is configured (see /api/chatbot/reindex). Swap
 * for a vector similarity search once real embeddings are available.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Message is required." }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const queryWords = tokenize(parsed.data.message);
    if (queryWords.length === 0) {
      return NextResponse.json({
        success: true,
        data: { answer: "Bisa tolong perjelas pertanyaannya? Saya bisa bantu seputar riset, proyek, tim, dan lab AILO." },
      });
    }

    const qaEntries = await ChatbotQA.find({}).lean<{ question: string; answer: string }[]>();
    let bestQA: { answer: string; score: number } | null = null;
    for (const qa of qaEntries) {
      const questionWords = new Set(tokenize(qa.question));
      let score = 0;
      for (const word of queryWords) {
        if (questionWords.has(word)) score += 1;
      }
      const overlap = score / Math.max(questionWords.size, 1);
      if (overlap >= 0.6 && (!bestQA || score > bestQA.score)) {
        bestQA = { answer: qa.answer, score };
      }
    }
    if (bestQA) {
      return NextResponse.json({ success: true, data: { answer: bestQA.answer } });
    }

    const chunks = await ChatEmbedding.find({}).lean();

    let best: { chunkText: string; score: number } | null = null;
    for (const chunk of chunks) {
      const chunkWords = new Set(tokenize(chunk.chunkText as string));
      let score = 0;
      for (const word of queryWords) {
        if (chunkWords.has(word)) score += 1;
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { chunkText: chunk.chunkText as string, score };
      }
    }

    const answer = best
      ? best.chunkText.slice(0, 500)
      : "Saya belum menemukan jawaban pasti untuk itu di konten AILO yang ter-index. Coba tanyakan seputar riset, proyek, tim, atau lab kami, atau hubungi ailo@telkomuniversity.ac.id untuk bantuan langsung.";

    return NextResponse.json({ success: true, data: { answer } });
  } catch (error) {
    console.error("Failed to answer chatbot query", error);
    return NextResponse.json({ success: false, error: "Unable to answer right now." }, { status: 500 });
  }
}
