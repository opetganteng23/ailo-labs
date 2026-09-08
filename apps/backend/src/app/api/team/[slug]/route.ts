import { deleteBySlugHandler, getBySlugHandler, updateBySlugHandler } from "@/lib/crud";
import { Team } from "@/models/Team";

import { teamInputSchema } from "../route";

export const dynamic = "force-dynamic";

export const GET = getBySlugHandler(Team);
export const PUT = updateBySlugHandler(Team, teamInputSchema);
export const DELETE = deleteBySlugHandler(Team);
