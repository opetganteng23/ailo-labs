import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { stripHtml } from "@/lib/htmlText";
import { connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { decryptSecret } from "@/lib/secretCrypto";
import { ChatbotQA } from "@/models/ChatbotQA";
import { ChatEmbedding } from "@/models/ChatEmbedding";
import { Book, Partner, Service } from "@/models/catalog";
import { Lab } from "@/models/Lab";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { SiteSettings } from "@/models/SiteSettings";
import { Team } from "@/models/Team";

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
  const chunks = (await ChatEmbedding.find({}).lean<{ chunkText: string }[]>()).map((c) => ({
    // The index built before HTML stripping existed still holds raw markup; never quote that to a visitor.
    chunkText: stripHtml(c.chunkText).replace(/\s+/g, " ").trim(),
  }));
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

const PERSONA = `Kamu adalah "Ask AILO", asisten virtual resmi CoE AILO (AI Learning For Optimization), Center of Excellence di Telkom University. Tugasmu menjadi informan: pengunjung bertanya, kamu menjawab berdasarkan informasi dari situs AILO yang diberikan di pesan.

Aturan:
- Perkenalkan diri dengan singkat bila disapa (halo, hai, selamat pagi, dst.) atau ditanya siapa kamu, lalu tawarkan bantuan seputar berita, riset, proyek, tim, lab, layanan, buku, dan mitra AILO.
- Jawab dalam bahasa yang dipakai pengunjung, ringkas, ramah, dan natural. Jangan menyalin mentah potongan teks; susun jawaban sendiri.
- Untuk fakta (nama, tanggal, angka, kerja sama), hanya gunakan informasi yang diberikan. Jangan mengarang. Jika belum ada informasinya, katakan terus terang dan arahkan ke halaman Kontak (ailo@telkomuniversity.ac.id).
- Jangan menampilkan kode, HTML, atau format teknis.`;

const short = (text: string | undefined, max: number) => stripHtml(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const idDate = (d?: Date) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "");

/**
 * Live, structured grounding fetched straight from the database according to what the visitor asks.
 * Keyword retrieval over indexed chunks can't answer "who is on the team", "what's new" or "who are
 * the partners" (those are lists, not passages), and an index can be stale - so these come from the
 * source of truth every time. Always includes what AILO is, from the About section.
 */
async function buildBaseContext(question: string): Promise<string[]> {
  const q = question.toLowerCase();
  const has = (re: RegExp) => re.test(q);
  const out: string[] = [];

  const settings = await SiteSettings.findOne({ key: "global" }).select("about contact").lean<{ about?: { title?: string; body?: string }; contact?: { email?: string; phone?: string; address?: string; address2?: string } }>();
  const about = [settings?.about?.title, short(settings?.about?.body, 1200)].filter(Boolean).join(" ").trim();
  if (about) out.push(`Tentang AILO: ${about}`);

  const jobs: Promise<void>[] = [];

  if (has(/berita|news|terbaru|terkini|\bbaru\b|update|kabar|pengumuman/)) {
    jobs.push(
      News.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).limit(8).select("title summary publishedAt").lean<{ title: string; summary?: string; publishedAt?: Date }[]>().then((rows) => {
        if (rows.length) out.push("Berita terbaru AILO (dari yang paling baru):\n" + rows.map((n, i) => `${i + 1}. ${n.title}${n.publishedAt ? ` (${idDate(n.publishedAt)})` : ""}${n.summary ? ` - ${short(n.summary, 200)}` : ""}`).join("\n"));
      }),
    );
  }
  if (has(/tim|orang|siapa|anggota|peneliti|dosen|team|people|pimpin|ketua|direktur|dewan|advisor|member|mahasiswa/)) {
    jobs.push(
      Team.find({ isActive: true }).select("name position category categories displayOrder").lean<{ name: string; position?: string; category?: string; categories?: string[] }[]>().then((rows) => {
        if (rows.length) out.push("Tim / orang di balik AILO (nama - jabatan - kategori):\n" + rows.map((t) => `- ${t.name} - ${t.position ?? "-"} - ${(t.categories?.length ? t.categories : [t.category]).filter(Boolean).join(", ")}`).join("\n"));
      }),
    );
  }
  if (has(/kerja ?sama|mitra|partner|kolaborasi|bekerja|rekan/)) {
    jobs.push(
      Partner.find({ status: "published" }).select("title description").lean<{ title: string; description?: string }[]>().then((rows) => {
        if (rows.length) out.push("Mitra kerja sama AILO:\n" + rows.map((p) => `- ${p.title}${p.description ? `: ${short(p.description, 160)}` : ""}`).join("\n"));
      }),
    );
  }
  if (has(/proyek|project/)) {
    jobs.push(
      Project.find({ publishStatus: { $nin: ["review", "archived"] } }).sort({ publishedAt: -1, createdAt: -1 }).limit(12).select("title description status").lean<{ title: string; description?: string; status?: string }[]>().then((rows) => {
        if (rows.length) out.push("Proyek AILO:\n" + rows.map((p) => `- ${p.title}${p.status ? ` [${p.status}]` : ""}: ${short(p.description, 200)}`).join("\n"));
      }),
    );
  }
  if (has(/riset|penelitian|research|publikasi/)) {
    jobs.push(
      Research.find({ status: "published" }).sort({ publishedAt: -1, createdAt: -1 }).limit(12).select("title description").lean<{ title: string; description?: string }[]>().then((rows) => {
        if (rows.length) out.push("Riset AILO:\n" + rows.map((r) => `- ${r.title}: ${short(r.description, 200)}`).join("\n"));
      }),
    );
  }
  if (has(/\blab|laboratorium|booking|pesan|pinjam|alat|fasilitas|ruang/)) {
    jobs.push(
      Lab.find({ isActive: true }).select("name location capacity facilities description").lean<{ name: string; location?: string; capacity?: number; facilities?: string; description?: string }[]>().then((rows) => {
        const how = "Cara booking lab: pengunjung membuka halaman Labs di situs AILO, memilih lab dan slot waktu, lalu mengisi nomor kartu member AILO. Booking harus disetujui admin dan hanya anggota (member) yang kartunya aktif yang bisa memesan.";
        out.push(rows.length ? `Lab AILO:
${rows.map((l) => `- ${l.name}${l.location ? ` (${l.location})` : ""}${l.capacity ? `, kapasitas ${l.capacity} orang` : ""}${l.facilities ? `, fasilitas: ${short(l.facilities, 160)}` : ""}`).join("\n")}
${how}` : how);
      }),
    );
  }
  if (has(/member|anggota|daftar|join|gabung|kartu|keanggotaan|registrasi/)) {
    out.push(
      "Cara menjadi member AILO: buka halaman Join di situs AILO, isi formulir (nama, email, afiliasi, jenis keanggotaan seperti Dosen, Peneliti, Peneliti Mahasiswa, Peneliti Alumni, atau Honorary Advisory Board) dan unggah dokumen bukti. Tidak perlu membuat password. Admin akan meninjau; jika disetujui, pemohon mendapat kartu member digital (ID kartu dan QR) lewat email. Kartu dipakai untuk booking lab dan bisa diverifikasi lewat halaman verifikasi. Pemohon bisa memilih apakah nama dan profilnya ditampilkan di halaman People.",
    );
  }
  if (has(/layanan|service|jasa|konsultasi|pesan solusi|aplikasi|pelatihan/)) {
    jobs.push(
      Service.find({ status: "published" }).select("title description").lean<{ title: string; description?: string }[]>().then((rows) => {
        if (rows.length) out.push("Layanan AILO:\n" + rows.map((v) => `- ${v.title}: ${short(v.description, 200)}`).join("\n"));
      }),
    );
  }
  if (has(/buku|book|baca|ebook/)) {
    jobs.push(
      Book.find({ status: "published" }).select("title author year description").lean<{ title: string; author?: string; year?: number; description?: string }[]>().then((rows) => {
        if (rows.length) out.push("Buku AILO:\n" + rows.map((b) => `- ${b.title}${b.author ? ` oleh ${b.author}` : ""}${b.year ? ` (${b.year})` : ""}: ${short(b.description, 200)}`).join("\n"));
      }),
    );
  }
  if (has(/kontak|hubungi|alamat|telepon|email|lokasi|kantor|whatsapp/) && settings?.contact) {
    const c = settings.contact;
    out.push(`Kontak AILO: ${[c.email && `email ${c.email}`, c.phone && `telepon ${c.phone}`, c.address && `alamat ${c.address}`, c.address2 && `alamat kedua ${c.address2}`].filter(Boolean).join("; ")}`);
  }

  await Promise.all(jobs);
  return out;
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
        system: options.systemPrompt,
        messages: [{ role: "user", content: `${contextBlock}\n\nPertanyaan pengunjung: ${options.question}` }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("Claude call failed", res.status, await res.text().catch(() => ""));
      return null;
    }

    const json = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
    const answer = (json.content ?? [])
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!answer) {
      console.error("Claude call returned no text content", JSON.stringify(json).slice(0, 500));
      return null;
    }

    return {
      answer,
      usage: json.usage ? { input: json.usage.input_tokens ?? 0, output: json.usage.output_tokens ?? 0 } : undefined,
    };
  } catch (error) {
    console.error("Claude call threw", error);
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
      if (!withinBudget) console.error("Chatbot: monthly token budget reached, falling back to keyword search");
      if (!withinDailyLimit) console.error("Chatbot: visitor hit the daily AI question limit, falling back to keyword search");

      if (withinBudget && withinDailyLimit) {
        let apiKey: string | null = null;
        try {
          apiKey = decryptSecret(cb.apiKeyEncrypted);
        } catch (error) {
          console.error("Chatbot: could not decrypt stored API key", error);
        }

        if (apiKey) {
          const result = await askClaude({
            apiKey,
            model: cb.chatModel?.trim() || "claude-haiku-5-5",
            maxTokens: Math.max(cb.maxTokens ?? 800, 1200),
            systemPrompt: cb.systemPrompt ? `${PERSONA}

Instruksi tambahan dari admin:
${cb.systemPrompt}` : PERSONA,
            question: parsed.data.message,
            context: [...(await buildBaseContext(parsed.data.message)), ...topChunks.map((c) => c.chunkText)],
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
