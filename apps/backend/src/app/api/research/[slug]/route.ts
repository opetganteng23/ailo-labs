import { deleteBySlugHandler, getBySlugHandler, updateBySlugHandler } from "@/lib/crud";
import { Research } from "@/models/Research";

import { researchInputSchema } from "../route";

export const dynamic = "force-dynamic";

export const GET = getBySlugHandler(Research);
export const PUT = updateBySlugHandler(Research, researchInputSchema);
export const DELETE = deleteBySlugHandler(Research);
