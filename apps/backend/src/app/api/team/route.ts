import { z } from "zod";

import { createHandler, listHandler } from "@/lib/crud";
import { Team } from "@/models/Team";

export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const teamInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(slugRegex),
  photo: z.string().trim().optional(),
  position: z.string().trim().min(1).max(160),
  bio: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  scopusAuthorId: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const GET = listHandler(Team, { publicFilter: { isActive: true }, sort: { name: 1 } });
export const POST = createHandler(Team, teamInputSchema);
