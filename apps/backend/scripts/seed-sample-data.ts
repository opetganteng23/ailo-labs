import dns from "node:dns";

import mongoose from "mongoose";

import { Device } from "../src/models/Device";

// Some sandboxed/dev DNS resolvers don't answer SRV queries used by
// mongodb+srv:// URIs. Prefer a public resolver for this one-off script.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import { Lab } from "../src/models/Lab";
import { Project } from "../src/models/Project";
import { Research } from "../src/models/Research";
import { SiteSettings } from "../src/models/SiteSettings";
import { Team } from "../src/models/Team";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "ailo";
  if (!uri) throw new Error("MONGODB_URI is not set.");

  await mongoose.connect(uri, { dbName });

  await SiteSettings.findOneAndUpdate(
    { key: "global" },
    {
      $setOnInsert: {
        key: "global",
        branding: { siteName: "AILO", tagline: "AI Learning For Optimization" },
        contact: {
          email: "ailo@telkomuniversity.ac.id",
          phone: "+62 22 756 4108",
          address: "Gedung TULT, Telkom University, Bandung, Jawa Barat — SAMPLE, replace with real address.",
          officeHours: "Mon-Fri 08:00-16:00 WIB",
        },
        socialMedia: {
          instagram: "https://instagram.com/ailo.telkomuniversity",
          linkedin: "https://linkedin.com/company/ailo-telkomuniversity",
          youtube: "https://youtube.com/@ailotelkomuniversity",
        },
        featureToggles: { booking: true, newsAI: false, tts: true },
      },
    },
    { upsert: true },
  );
  console.log("Seeded SiteSettings (sample contact/social values — confirm with real values).");

  const researchDocs = [
    {
      title: "Sample Research — Optimization & Reinforcement Learning",
      slug: "sample-optimization-rl",
      description: "Sample entry: decision-making algorithms for scheduling under uncertainty.",
      content: "This is sample research content. Replace with real research area write-ups.",
      status: "published",
    },
    {
      title: "Sample Research — NLP & RAG",
      slug: "sample-nlp-rag",
      description: "Sample entry: retrieval-augmented generation for Bahasa Indonesia.",
      content: "This is sample research content. Replace with real research area write-ups.",
      status: "published",
    },
  ];
  for (const doc of researchDocs) {
    await Research.findOneAndUpdate({ slug: doc.slug }, { $setOnInsert: doc }, { upsert: true });
  }
  console.log(`Seeded ${researchDocs.length} sample Research docs.`);

  const projectDocs = [
    {
      title: "Sample Project — Campus Lab Scheduling Optimizer",
      slug: "sample-lab-scheduling-optimizer",
      description: "Sample entry: RL scheduler cutting booking conflicts across shared facilities.",
      content: "This is sample project content. Replace with real project write-ups.",
      status: "ongoing",
    },
    {
      title: "Sample Project — Bahasa Indonesia RAG Assistant",
      slug: "sample-rag-assistant",
      description: "Sample entry: RAG chatbot infrastructure for public information access.",
      content: "This is sample project content. Replace with real project write-ups.",
      status: "planned",
    },
  ];
  for (const doc of projectDocs) {
    await Project.findOneAndUpdate({ slug: doc.slug }, { $setOnInsert: doc }, { upsert: true });
  }
  console.log(`Seeded ${projectDocs.length} sample Project docs.`);

  const teamDocs = [
    {
      name: "Sample Team Member — Dr. Andini Prasetyo",
      slug: "sample-andini-prasetyo",
      position: "Lab Director — Optimization (sample data)",
      bio: "Sample bio — replace with real profile.",
      scopusData: { hIndex: 14, citationCount: 420, documentCount: 38 },
      isActive: true,
    },
    {
      name: "Sample Team Member — Dr. Rangga Wibisono",
      slug: "sample-rangga-wibisono",
      position: "NLP Research Lead (sample data)",
      bio: "Sample bio — replace with real profile.",
      scopusData: { hIndex: 9, citationCount: 180, documentCount: 21 },
      isActive: true,
    },
  ];
  for (const doc of teamDocs) {
    await Team.findOneAndUpdate({ slug: doc.slug }, { $setOnInsert: doc }, { upsert: true });
  }
  console.log(`Seeded ${teamDocs.length} sample Team docs.`);

  const labDocs = [
    {
      name: "Sample Lab — Deep Learning Lab",
      slug: "sample-deep-learning-lab",
      location: "TULT Building, 3rd floor (sample data)",
      capacity: 12,
      description: "Sample lab — replace with real data. 4x GPU node, 12 workstations.",
      isActive: true,
    },
    {
      name: "Sample Lab — Computer Vision Lab",
      slug: "sample-computer-vision-lab",
      location: "TULT Building, 2nd floor (sample data)",
      capacity: 8,
      description: "Sample lab — replace with real data. Camera rigs and edge devices.",
      isActive: true,
    },
  ];
  for (const doc of labDocs) {
    const lab = await Lab.findOneAndUpdate({ slug: doc.slug }, { $setOnInsert: doc }, { upsert: true, new: true });
    const deviceCount = await Device.countDocuments({ lab: lab._id });
    if (deviceCount === 0) {
      const device = await Device.create({
        name: `Sample Device — ${doc.name.replace("Sample Lab — ", "")} Node 1`,
        specification: "Sample specification — replace with real device data.",
        lab: lab._id,
        status: "available",
      });
      lab.devices.push(device._id);
      await lab.save();
    }
  }
  console.log(`Seeded ${labDocs.length} sample Lab docs (with one Device each).`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((error) => {
  console.error("Failed to seed sample data:", error);
  process.exit(1);
});
