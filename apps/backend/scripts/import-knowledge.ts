import dns from "node:dns";
import { readFileSync } from "node:fs";

import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { KnowledgeDoc } from "../src/models/KnowledgeDoc";

/**
 * Imports chatbot knowledge documents from a JSON file: [{ title, source, content }].
 * Every document whose `source` appears in the file is replaced, so re-running with a newer version is safe.
 * Run the chatbot reindex afterwards (Admin > Chatbot).
 */
async function main() {
  const file = process.argv[2];
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  if (!file) throw new Error("Usage: tsx scripts/import-knowledge.ts <file.json>");
  if (!uri) throw new Error("MONGODB_URI is not set.");

  const docs = JSON.parse(readFileSync(file, "utf8")) as { title: string; source: string; content: string }[];
  await mongoose.connect(uri, { dbName });
  for (const source of new Set(docs.map((d) => d.source))) {
    const removed = await KnowledgeDoc.deleteMany({ source });
    console.log(`Replaced "${source}" (removed ${removed.deletedCount})`);
  }
  await KnowledgeDoc.insertMany(docs.map((d) => ({ ...d, status: "published" })));
  console.log(`Imported ${docs.length} documents into ${dbName}.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
