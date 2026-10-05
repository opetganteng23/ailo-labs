import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

const newsInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1),
  category: z.string().trim().min(1).max(80),
  images: z.array(z.string().url()).max(2).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const status = request.nextUrl.searchParams.get("status") ?? "published";
    const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? 1), 1);
    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 12), 1),
      50,
    );
    const filter = status === "all" ? {} : { status };

    const [items, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-content -source5W1H")
        .lean(),
      News.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list news", error);

    return NextResponse.json(
      { success: false, error: "Unable to load news." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const parsed = newsInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Some of the information isn't valid. Please check it and try again." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const news = await News.create({
      ...parsed.data,
      publishedAt: parsed.data.status === "published" ? new Date() : undefined,
    });

    return NextResponse.json({ success: true, data: news }, { status: 201 });
  } catch (error) {
    console.error("Failed to create news", error);

    return NextResponse.json(
      { success: false, error: "Unable to create news." },
      { status: 500 },
    );
  }
}
