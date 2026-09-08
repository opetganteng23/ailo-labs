import dns from "node:dns";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../src/models/User";

// Some sandboxed/dev DNS resolvers don't answer SRV queries used by
// mongodb+srv:// URIs. Prefer a public resolver for this one-off script.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!uri) throw new Error("MONGODB_URI is not set.");
  if (!email || !password) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD are not set.");

  await mongoose.connect(uri, { dbName });

  const existing = await User.findOne({ role: "super_admin" });
  if (existing) {
    console.log(`A super_admin user already exists (${existing.email}). Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: "AILO Super Admin",
    email: email.toLowerCase(),
    role: "super_admin",
    passwordHash,
  });

  console.log("Created super_admin user:");
  console.log(`  email:    ${user.email}`);
  console.log(`  password: ${password}`);
  console.log("Log in at /admin/login. Change this password after first login.");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});
