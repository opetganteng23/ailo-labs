import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  summary: z.string().trim().min(1).max(500).optional(),
  content: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  images: z.array(z.string()).max(2).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    await connectToDatabase();
    const { slug } = await ctx.params;
    const news = await News.findOne({ slug }).lean();
    if (!news) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error("Failed to load news", error);
    return NextResponse.json({ success: false, error: "Unable to load news." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Some of the information isn't valid. Please check it and try again." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const { slug } = await ctx.params;
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "published") {
      update.publishedAt = new Date();
    }
    const news = await News.findOneAndUpdate({ slug }, update, { new: true });
    if (!news) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: news });
  } catch (error) {
    console.error("Failed to update news", error);
    return NextResponse.json({ success: false, error: "Unable to update news." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const { slug } = await ctx.params;
    const news = await News.findOneAndDelete({ slug });
    if (!news) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete news", error);
    return NextResponse.json({ success: false, error: "Unable to delete news." }, { status: 500 });
  }
}
