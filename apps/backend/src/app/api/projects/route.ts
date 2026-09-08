import { z } from "zod";

import { createHandler, listHandler } from "@/lib/crud";
import { Project } from "@/models/Project";

export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(220).regex(slugRegex),
  description: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1),
  images: z.array(z.string()).default([]),
  status: z.enum(["ongoing", "completed", "planned"]).default("planned"),
  teamMembers: z.array(z.string()).default([]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GET = listHandler(Project, { sort: { createdAt: -1 } });
export const POST = createHandler(Project, projectInputSchema);
