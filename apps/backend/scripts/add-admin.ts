import dns from "node:dns";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../src/models/User";

// Some sandboxed/dev DNS resolvers don't answer SRV queries used by
// mongodb+srv:// URIs. Prefer a public resolver for this one-off script.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

type Role = "super_admin" | "admin" | "staff_lab";

/**
 * Creates or updates a single admin/staff account, identified by email.
 * Reuse this for adding additional admins beyond the initial one from
 * seed-admin.ts, e.g.:
 *   NEW_ADMIN_EMAIL=someone@example.com NEW_ADMIN_PASSWORD=... npm run admin:add
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  const email = process.env.NEW_ADMIN_EMAIL;
  const password = process.env.NEW_ADMIN_PASSWORD;
  const role = (process.env.NEW_ADMIN_ROLE as Role | undefined) ?? "super_admin";
  const name = process.env.NEW_ADMIN_NAME ?? email?.split("@")[0] ?? "Admin";

  if (!uri) throw new Error("MONGODB_URI is not set.");
  if (!email || !password) throw new Error("NEW_ADMIN_EMAIL / NEW_ADMIN_PASSWORD are not set.");
  if (!["super_admin", "admin", "staff_lab"].includes(role)) {
    throw new Error(`Invalid NEW_ADMIN_ROLE: ${role}`);
  }

  await mongoose.connect(uri, { dbName });

  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { name, email: normalizedEmail, role, passwordHash } },
    { upsert: true, new: true },
  );

  console.log(`Upserted ${role} user:`);
  console.log(`  email: ${user.email}`);
  console.log(`  role:  ${user.role}`);
  console.log("Log in at /admin/login.");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to add admin user:", error);
  process.exit(1);
});
