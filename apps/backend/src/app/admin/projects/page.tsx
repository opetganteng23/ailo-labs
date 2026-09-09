import { ImageUploadField } from "@/components/ImageUploadField";
import { connectToDatabase } from "@/lib/mongodb";
import { Project } from "@/models/Project";

import { createProjectAction, deleteProjectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  await connectToDatabase();
  const items = (await Project.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    title: string;
    status: string;
  }[];

  return (
    <div>
      <h1>Projects</h1>
      <form className="stack" action={createProjectAction} style={{ marginTop: 24 }}>
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
              <td>
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
    </div>
  );
}
