import { z } from "zod";

import { createHandler, listHandler } from "@/lib/crud";
import { Lab } from "@/models/Lab";

export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const labInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(slugRegex),
  location: z.string().trim().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
  description: z.string().trim().optional(),
  photos: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const GET = listHandler(Lab, { publicFilter: { isActive: true }, sort: { name: 1 } });
export const POST = createHandler(Lab, labInputSchema);
