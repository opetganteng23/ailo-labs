import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";
import { Project } from "@/models/Project";
import { Research } from "@/models/Research";
import { Service } from "@/models/catalog";

export const dynamic = "force-dynamic";

const MODELS = { news: News, research: Research, project: Project, service: Service } as const;

/** Categories already in use for one kind of content (public: only names, no content). */
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind") ?? "";
  if (!(kind in MODELS)) return NextResponse.json({ success: false, error: "Unknown kind." }, { status: 400 });
  await connectToDatabase();
  const names = (await MODELS[kind as keyof typeof MODELS].distinct("categories")) as string[];
  return NextResponse.json({ success: true, data: { categories: names.filter(Boolean).sort((a, b) => a.localeCompare(b)) } });
}
