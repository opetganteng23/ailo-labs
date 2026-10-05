import dns from "node:dns";

import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { Member } from "../src/models/Member";
import { Team } from "../src/models/Team";

/** One-off: copies each profile's single category into the new `categories` list. Safe to run repeatedly. */
async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  if (!uri) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(uri, { dbName });
  const team = await Team.updateMany({ category: { $exists: true, $ne: "" }, $or: [{ categories: { $exists: false } }, { categories: { $size: 0 } }] }, [{ $set: { categories: ["$category"] } }], { updatePipeline: true });
  const members = await Member.updateMany({ teamCategory: { $exists: true, $ne: "" }, $or: [{ teamCategories: { $exists: false } }, { teamCategories: { $size: 0 } }] }, [{ $set: { teamCategories: ["$teamCategory"] } }], { updatePipeline: true });
  console.log(`${dbName}: team ${team.modifiedCount}, members ${members.modifiedCount}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
