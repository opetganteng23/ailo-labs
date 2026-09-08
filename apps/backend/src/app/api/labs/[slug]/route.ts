import { deleteBySlugHandler, getBySlugHandler, updateBySlugHandler } from "@/lib/crud";
import { Lab } from "@/models/Lab";

import { labInputSchema } from "../route";

export const dynamic = "force-dynamic";

export const GET = getBySlugHandler(Lab);
export const PUT = updateBySlugHandler(Lab, labInputSchema);
export const DELETE = deleteBySlugHandler(Lab);
