import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, rateLimited } from "@/lib/rateLimit";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";

export const dynamic = "force-dynamic";

const REACTIONS = ["keren", "inspiratif", "wow", "belajarBaru"] as const;
const KINDS = ["news", "research", "project"] as const;

const bodySchema = z.object({
  kind: z.enum(KINDS),
  slug: z.string().trim().min(1).max(220),
  reaction: z.enum(REACTIONS),
});

// Only reacts to content that's actually publicly visible, same visibility
// rule each detail page itself uses - prevents reacting to a draft/archived
// item via the API directly.
const MODELS = {
  news: { model: News, filter: (slug: string) => ({ slug, status: "published" }) },
  research: { model: Research, filter: (slug: string) => ({ slug, status: "published" }) },
  project: { model: Project, filter: (slug: string) => ({ slug, publishStatus: { $nin: ["review", "archived"] } }) },
} as const;

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  // One visitor can still only hold one reaction client-side (enforced via
  // localStorage, not here), but this keeps a single IP from hammering the
  // endpoint with a script.
  const ip = clientIp(request.headers);
  if (rateLimited(`react:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    await connectToDatabase();
    const { kind, slug, reaction } = parsed.data;
    const { model, filter } = MODELS[kind];
    const updated = await model
      .findOneAndUpdate(filter(slug), { $inc: { [`reactions.${reaction}`]: 1 } }, { new: true })
      .select("reactions")
      .lean<{ reactions?: Record<string, number> }>();

    if (!updated) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });

    return NextResponse.json({ success: true, data: { reactions: updated.reactions ?? {} } });
  } catch (error) {
    console.error("Failed to record reaction", error);
    return NextResponse.json({ success: false, error: "Unable to record reaction." }, { status: 500 });
  }
}
