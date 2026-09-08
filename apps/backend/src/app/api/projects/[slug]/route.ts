import { deleteBySlugHandler, getBySlugHandler, updateBySlugHandler } from "@/lib/crud";
import { Project } from "@/models/Project";

import { projectInputSchema } from "../route";

export const dynamic = "force-dynamic";

export const GET = getBySlugHandler(Project);
export const PUT = updateBySlugHandler(Project, projectInputSchema);
export const DELETE = deleteBySlugHandler(Project);
