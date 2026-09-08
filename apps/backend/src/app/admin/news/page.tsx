import { connectToDatabase } from "@/lib/mongodb";
import { News } from "@/models/News";

import { deleteNewsAction } from "./actions";
import { NewsForm } from "./NewsForm";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  await connectToDatabase();
  const items = (await News.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    title: string;
    slug: string;
    status: string;
  }[];

  return (
    <div>
      <h1>News</h1>

      <h2 style={{ marginTop: 32 }}>New article (5W+1H draft)</h2>
      <p style={{ fontSize: 13, color: "#5b6469" }}>
        Fill in the 5W+1H fields, generate a draft locally, edit it, then publish. TODO: wire a real LLM API key to
        auto-write fluent prose instead of the template draft.
      </p>
      <NewsForm />

      <h2 style={{ marginTop: 40 }}>All articles</h2>
      <table style={{ marginTop: 16 }}>
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
                <form action={deleteNewsAction}>
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
