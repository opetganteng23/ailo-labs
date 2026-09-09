import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { updateProjectAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const item = await Project.findById(id).lean<{
    _id: string;
    title: string;
    description: string;
    content: string;
    status: string;
    images?: string[];
  }>();
  if (!item) notFound();

  return (
    <div>
      <p>
        <Link href="/admin/projects">Projects</Link> / {item.title}
      </p>
      <h1>Edit project</h1>

      <form className="stack" action={updateProjectAction} style={{ marginTop: 24 }}>
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
            <option value="planned">Planned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <ImageUploadField name="image" label="Cover image" defaultValue={item.images?.[0]} />
        <button type="submit" className="btn">
          Save changes
        </button>
      </form>
    </div>
  );
}
