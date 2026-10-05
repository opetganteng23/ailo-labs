import { NextRequest, NextResponse } from "next/server";
import type { ZodObject, ZodRawShape } from "zod";

import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = any;
type AnySchema = ZodObject<ZodRawShape>;

export function listHandler(Model: AnyModel, opts: { publicFilter?: Record<string, unknown>; sort?: Record<string, 1 | -1> } = {}) {
  return async function GET() {
    try {
      await connectToDatabase();
      const items = await Model.find(opts.publicFilter ?? {})
        .sort(opts.sort ?? { createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: items });
    } catch (error) {
      console.error("Failed to list documents", error);
      return NextResponse.json({ success: false, error: "Unable to load data." }, { status: 503 });
    }
  };
}

export function createHandler(Model: AnyModel, schema: AnySchema) {
  return async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Some of the information isn't valid. Please check it and try again." },
        { status: 400 },
      );
    }

    try {
      await connectToDatabase();
      const doc = await Model.create(parsed.data);
      return NextResponse.json({ success: true, data: doc }, { status: 201 });
    } catch (error) {
      console.error("Failed to create document", error);
      const status = (error as { code?: number })?.code === 11000 ? 409 : 500;
      return NextResponse.json(
        { success: false, error: status === 409 ? "Slug already exists." : "Unable to create." },
        { status },
      );
    }
  };
}

export function getBySlugHandler(Model: AnyModel) {
  return async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
      await connectToDatabase();
      const { slug } = await ctx.params;
      const doc = await Model.findOne({ slug }).lean();
      if (!doc) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
      return NextResponse.json({ success: true, data: doc });
    } catch (error) {
      console.error("Failed to load document", error);
      return NextResponse.json({ success: false, error: "Unable to load data." }, { status: 503 });
    }
  };
}

export function updateBySlugHandler(Model: AnyModel, schema: AnySchema) {
  return async function PUT(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const parsed = schema.partial().safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Some of the information isn't valid. Please check it and try again." },
        { status: 400 },
      );
    }

    try {
      await connectToDatabase();
      const { slug } = await ctx.params;
      const doc = await Model.findOneAndUpdate({ slug }, parsed.data, { new: true });
      if (!doc) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
      return NextResponse.json({ success: true, data: doc });
    } catch (error) {
      console.error("Failed to update document", error);
      return NextResponse.json({ success: false, error: "Unable to update." }, { status: 500 });
    }
  };
}

export function deleteBySlugHandler(Model: AnyModel) {
  return async function DELETE(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    try {
      await connectToDatabase();
      const { slug } = await ctx.params;
      const doc = await Model.findOneAndDelete({ slug });
      if (!doc) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Failed to delete document", error);
      return NextResponse.json({ success: false, error: "Unable to delete." }, { status: 500 });
    }
  };
}
