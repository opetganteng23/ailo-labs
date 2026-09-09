import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

import { updateResearchAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminResearchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await Research.findById(id).lean<{
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    image?: string;
  }>();
  if (!item) notFound();

  return (
    <div>
      <p>
        <Link href="/admin/research">Research</Link> / {item.title}
      </p>
      <h1>Edit research</h1>

      <form className="stack" action={updateResearchAction} style={{ marginTop: 24 }}>
        <input type="hidden" name="id" value={item._id} />
        <label>
          Title
          <input name="title" required maxLength={200} defaultValue={item.title} />
        </label>
        <label>
          Description
          <textarea name="description" required maxLength={500} defaultValue={item.description} />
        </label>
        <label>
          Content
          <textarea name="content" required defaultValue={item.content} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={item.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <ImageUploadField name="image" label="Cover image" defaultValue={item.image} />
        <button type="submit" className="btn">
          Save changes
        </button>
      </form>
    </div>
  );
}
