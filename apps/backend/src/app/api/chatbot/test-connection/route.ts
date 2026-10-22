import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  provider: z.enum(["openai", "anthropic", "gemini", "custom"]),
  apiKey: z.string().trim().min(1),
  baseUrl: z.string().trim().optional(),
});

async function pingProvider(provider: string, apiKey: string, baseUrl?: string): Promise<{ ok: boolean; message: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let res: Response;
    if (provider === "openai") {
      res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
    } else if (provider === "anthropic") {
      res = await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        signal: controller.signal,
      });
    } else if (provider === "gemini") {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
        signal: controller.signal,
      });
    } else {
      if (!baseUrl) return { ok: false, message: "Base URL is required for a custom endpoint." };
      res = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
    }
    if (res.ok) return { ok: true, message: "Connection successful." };
    // Surface the provider's own explanation (e.g. "invalid x-api-key", "model not found")
    // instead of a bare status code - that's the difference between a wrong/expired key,
    // a key of the wrong kind (not every "sk-ant-..." string is a Console API key), and a
    // request this code is building wrong, and only the provider's own wording tells them apart.
    let detail = "";
    try {
      const text = (await res.text()).trim();
      if (text) {
        try {
          const parsed = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
          detail = (typeof parsed.error === "string" ? parsed.error : parsed.error?.message) || parsed.message || text;
        } catch {
          detail = text;
        }
      }
    } catch {
      // Body unreadable - fall back to just the status below.
    }
    return { ok: false, message: detail ? `Provider responded with status ${res.status}: ${detail.slice(0, 300)}` : `Provider responded with status ${res.status}.` };
  } catch {
    return { ok: false, message: "Could not reach the provider." };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "We could not read that request. Please try again." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "API key is required." }, { status: 400 });
  }

  const result = await pingProvider(parsed.data.provider, parsed.data.apiKey, parsed.data.baseUrl);
  return NextResponse.json({ success: result.ok, data: { message: result.message } });
}
