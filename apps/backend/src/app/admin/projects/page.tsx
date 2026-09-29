import Link from "next/link";

import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { createProjectAction, deleteProjectAction } from "./actions";
import { ProjectsBoard } from "./ProjectsBoard";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const isTable = view === "table";

  await connectToDatabase();
  const items = (await Project.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    title: string;
    status: "planned" | "ongoing" | "completed";
    images?: string[];
  }[];

  return (
    <div>
      <h1>Projects</h1>

      <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
        <Link href="/admin/projects" className={`btn ${isTable ? "outline" : ""}`}>
          Board
        </Link>
        <Link href="/admin/projects?view=table" className={`btn ${isTable ? "" : "outline"}`}>
          Table
        </Link>
      </div>

      <details style={{ marginBottom: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>New project</summary>
        <form className="stack" action={createProjectAction} style={{ marginTop: 16 }}>
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
            <select name="status" defaultValue="planned">
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <ImageUploadField name="image" label="Cover image" />
          <button type="submit" className="btn">
            Create
          </button>
        </form>
      </details>

      {isTable ? (
        <table style={{ marginTop: 24 }}>
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
                  <Link href={`/admin/projects/${item._id}`} className="btn outline">
                    Edit
                  </Link>
                  <form action={deleteProjectAction}>
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
      ) : (
        <ProjectsBoard
          items={items.map((item) => ({
            _id: item._id,
            title: item.title,
            status: item.status,
            image: item.images?.[0],
          }))}
        />
      )}
    </div>
  );
}
