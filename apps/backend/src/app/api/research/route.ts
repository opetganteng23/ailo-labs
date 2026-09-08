import { z } from "zod";

import { createHandler, listHandler } from "@/lib/crud";
import { Research } from "@/models/Research";

export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const researchInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(220).regex(slugRegex),
  description: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1),
  image: z.string().trim().optional(),
  relatedTeamMembers: z.array(z.string()).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const GET = listHandler(Research, { publicFilter: { status: "published" }, sort: { createdAt: -1 } });
export const POST = createHandler(Research, researchInputSchema);
