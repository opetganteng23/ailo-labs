import dns from "node:dns";

import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { News } from "../src/models/News";

/** One-off: copies each article's single category into the new `categories` list. Safe to run repeatedly. */
async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  if (!uri) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(uri, { dbName });
  const res = await News.updateMany(
    { category: { $exists: true, $ne: "" }, $or: [{ categories: { $exists: false } }, { categories: { $size: 0 } }] },
    [{ $set: { categories: ["$category"] } }],
    { updatePipeline: true },
  );
  console.log(`${dbName}: news ${res.modifiedCount}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
