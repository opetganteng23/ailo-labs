import Link from "next/link";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Research } from "@/models/Research";

import { createResearchAction, deleteResearchAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminResearchPage() {
  await connectToDatabase();
  const items = (await Research.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    title: string;
    status: string;
  }[];

  return (
    <div>
      <h1>Research</h1>
      <form className="stack" action={createResearchAction} style={{ marginTop: 24 }}>
        <label>
          Title
          <input name="title" required maxLength={200} />
        </label>
        <label>
          Description
          <textarea name="description" required maxLength={500} />
        </label>
        <label>
          Content
          <textarea name="content" required />
        </label>
        <label>
          Status
          <select name="status" defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <ImageUploadField name="image" label="Cover image" />
        <button type="submit" className="btn">
          Create
        </button>
      </form>

      <table style={{ marginTop: 32 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.title}</td>
              <td>
                <span className="badge">{item.status}</span>
              </td>
              <td style={{ display: "flex", gap: 8 }}>
                <Link href={`/admin/research/${item._id}`} className="btn outline">
                  Edit
                </Link>
                <form action={deleteResearchAction}>
                  <input type="hidden" name="id" value={item._id} />
                  <button type="submit" className="btn danger">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
