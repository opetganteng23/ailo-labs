import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { decryptSecret } from "@/lib/secretCrypto";
import { ChatbotQA } from "@/models/ChatbotQA";
import { ChatEmbedding } from "@/models/ChatEmbedding";
import { SiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

const askSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

const STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "apa", "apakah", "adalah", "itu", "ini", "dengan", "pada", "bagaimana", "saya", "kamu", "anda",
  "the", "a", "an", "is", "are", "of", "to", "for", "and", "what", "how", "do", "does",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/** Cuts a long chunk at the last sentence end before 700 characters, so answers do not stop mid-word. */
function trimAnswer(text: string): string {
  if (text.length <= 700) return text;
  const cut = text.lastIndexOf(". ", 700);
  return cut > 300 ? text.slice(0, cut + 1) : `${text.slice(0, 700).trimEnd()}...`;
}

type ChatbotSettings = {
  provider?: string;
  apiKeyEncrypted?: string;
  chatModel?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  systemPrompt?: string;
  fallbackReply?: string;
  monthlyTokenBudget?: number;
  perVisitorDailyLimit?: number;
  tokensUsedThisMonth?: number;
  tokensUsagePeriod?: string;
};

/** Ranks indexed chunks by how rare their matched words are (IDF), so a distinctive word like "SATRIA" outweighs a common one like "riset". */
async function findRelevantChunks(queryWords: string[], topK: number): Promise<{ chunkText: string; score: number }[]> {
  const chunks = await ChatEmbedding.find({}).lean<{ chunkText: string }[]>();
  const tokenSets = chunks.map((chunk) => new Set(tokenize(chunk.chunkText)));
  const docFreq = new Map<string, number>();
  for (const set of tokenSets) for (const word of set) docFreq.set(word, (docFreq.get(word) ?? 0) + 1);
  const idf = (word: string) => Math.log(1 + chunks.length / (docFreq.get(word) ?? 1));

  const scored: { chunkText: string; score: number }[] = [];
  for (let i = 0; i < chunks.length; i++) {
    let score = 0;
    let matched = 0;
    for (const word of queryWords) {
      if (tokenSets[i].has(word)) {
        score += idf(word);
        matched += 1;
      }
    }
    if (matched === 0) continue;
    score *= 1 + matched / queryWords.length;
    scored.push({ chunkText: chunks[i].chunkText, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, Math.max(1, topK));
}

/**
 * Calls Claude with the visitor's question and the retrieved content as grounding context,
 * so it answers in natural language instead of handing back a raw excerpt. Returns null on
 * any failure (bad key, network, timeout, empty reply) so the caller can fall back cleanly -
 * a chatbot that goes silent on an API hiccup is worse than one that answers plainly.
 */
async function askClaude(options: {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  question: string;
  context: string[];
}): Promise<{ answer: string; usage?: { input: number; output: number } } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const contextBlock =
      options.context.length > 0
        ? `Berikut potongan konten dari situs AILO yang relevan dengan pertanyaan pengunjung. Jawab HANYA berdasarkan informasi ini, dengan bahasa yang natural dan ringkas - jangan mengarang di luar ini. Jika informasinya tidak cukup untuk menjawab, katakan kamu belum punya informasinya dan arahkan ke halaman Kontak.\n\n${options.context
            .map((c, i) => `[${i + 1}] ${c}`)
            .join("\n\n")}`
        : "Tidak ada konten relevan yang ditemukan di situs AILO untuk pertanyaan ini. Katakan kamu belum punya informasinya dan arahkan ke halaman Kontak - jangan mengarang jawaban.";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": options.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: [{ role: "user", content: `${contextBlock}\n\nPertanyaan pengunjung: ${options.question}` }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
    const answer = (json.content ?? [])
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!answer) return null;

    return {
      answer,
      usage: json.usage ? { input: json.usage.input_tokens ?? 0, output: json.usage.output_tokens ?? 0 } : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function recordTokenUsage(tokens: number) {
  const period = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const current = await SiteSettings.findOne({ key: "global" }).select("chatbot.tokensUsagePeriod").lean<{ chatbot?: { tokensUsagePeriod?: string } }>();
  if (current?.chatbot?.tokensUsagePeriod !== period) {
    await SiteSettings.updateOne({ key: "global" }, { $set: { "chatbot.tokensUsedThisMonth": tokens, "chatbot.tokensUsagePeriod": period } });
  } else {
    await SiteSettings.updateOne({ key: "global" }, { $inc: { "chatbot.tokensUsedThisMonth": tokens } });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "We could not read that request. Please try again." }, { status: 400 });
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

    // Curated Q&A takes priority when it's a close match - an admin wrote that answer on purpose.
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

    const settingsDoc = await SiteSettings.findOne({ key: "global" }).lean<{ chatbot?: ChatbotSettings }>();
    const cb = settingsDoc?.chatbot;
    const topChunks = await findRelevantChunks(queryWords, cb?.topK && cb.topK > 0 ? cb.topK : 5);

    // A real AI answer, when a key is configured and the visitor/budget limits allow it.
    if (cb?.provider === "anthropic" && cb.apiKeyEncrypted) {
      const withinBudget = !cb.monthlyTokenBudget || (cb.tokensUsedThisMonth ?? 0) < cb.monthlyTokenBudget;
      const withinDailyLimit = !rateLimited(`chatbot-ai:${clientIp(request.headers)}`, cb.perVisitorDailyLimit ?? 20, 24 * 60 * 60 * 1000);

      if (withinBudget && withinDailyLimit) {
        let apiKey: string | null = null;
        try {
          apiKey = decryptSecret(cb.apiKeyEncrypted);
        } catch {
          // Stored key is unreadable (e.g. NEXTAUTH_SECRET changed) - fall through to the plain-text fallback below.
        }

        if (apiKey) {
          const result = await askClaude({
            apiKey,
            model: cb.chatModel?.trim() || "claude-haiku-4-5",
            temperature: cb.temperature ?? 0.3,
            maxTokens: cb.maxTokens ?? 800,
            systemPrompt:
              cb.systemPrompt ||
              "Kamu adalah asisten virtual CoE AILO Telkom University. Jawab dengan bahasa yang sopan dan ringkas, hanya berdasarkan knowledge yang tersedia. Jika tidak tahu, katakan tidak tahu dan arahkan pengguna ke halaman kontak.",
            question: parsed.data.message,
            context: topChunks.map((c) => c.chunkText),
          });

          if (result) {
            if (result.usage) await recordTokenUsage(result.usage.input + result.usage.output);
            return NextResponse.json({ success: true, data: { answer: result.answer } });
          }
        }
      }
    }

    // No AI configured, limits reached, or the call failed - answer from the indexed content directly
    // rather than go silent.
    const answer = topChunks.length > 0
      ? trimAnswer(topChunks[0].chunkText)
      : cb?.fallbackReply ||
        "Saya belum menemukan jawaban pasti untuk itu di konten AILO yang ter-index. Coba tanyakan seputar riset, proyek, tim, atau lab kami, atau hubungi ailo@telkomuniversity.ac.id untuk bantuan langsung.";

    return NextResponse.json({ success: true, data: { answer } });
  } catch (error) {
    console.error("Failed to answer chatbot query", error);
    return NextResponse.json({ success: false, error: "Unable to answer right now." }, { status: 500 });
  }
}
