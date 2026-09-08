import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

import { createUserAction, deleteUserAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    redirect("/admin/dashboard?error=forbidden");
  }

  await connectToDatabase();
  const users = (await User.find().sort({ createdAt: -1 }).lean()) as unknown as {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }[];

  return (
    <div>
      <h1>Users</h1>
      <p style={{ fontSize: 13, color: "#5b6469" }}>Only super_admin accounts can manage users.</p>
      <form className="stack" action={createUserAction} style={{ marginTop: 24 }}>
        <label>
          Name
          <input name="name" required maxLength={160} />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="admin">
            <option value="admin">admin</option>
            <option value="staff_lab">staff_lab</option>
            <option value="super_admin">super_admin</option>
          </select>
        </label>
        <button type="submit" className="btn">
          Create user
        </button>
      </form>

      <table style={{ marginTop: 32 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {session.sub !== u._id && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="id" value={u._id} />
                    <button type="submit" className="btn danger">
                      Delete
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
