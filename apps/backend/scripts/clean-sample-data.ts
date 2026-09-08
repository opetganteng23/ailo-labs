import dns from "node:dns";

import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { Device } from "../src/models/Device";
import { Lab } from "../src/models/Lab";
import { Project } from "../src/models/Project";
import { Research } from "../src/models/Research";
import { SiteSettings } from "../src/models/SiteSettings";
import { Team } from "../src/models/Team";

/**
 * One-off cleanup: removes sample/placeholder documents inserted by an
 * earlier run of seed-sample-data.ts before its text was cleaned up
 * (some strings contained em dashes). Safe to run repeatedly; only
 * targets documents matching the "sample-" slug / "Sample" name
 * conventions used by that seed script.
 */
async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  if (!uri) throw new Error("MONGODB_URI is not set.");

  await mongoose.connect(uri, { dbName });

  const research = await Research.deleteMany({ slug: /^sample-/ });
  const projects = await Project.deleteMany({ slug: /^sample-/ });
  const team = await Team.deleteMany({ slug: /^sample-/ });
  const devices = await Device.deleteMany({ name: /^Sample/ });
  const labs = await Lab.deleteMany({ slug: /^sample-/ });
  const settings = await SiteSettings.deleteMany({ key: "global" });

  console.log("Deleted sample documents:", {
    research: research.deletedCount,
    projects: projects.deletedCount,
    team: team.deletedCount,
    devices: devices.deletedCount,
    labs: labs.deletedCount,
    settings: settings.deletedCount,
  });

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to clean sample data:", error);
  process.exit(1);
});
