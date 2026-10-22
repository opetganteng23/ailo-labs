/**
 * Shared with client components (e.g. the admin Team form), so this must
 * stay free of any server-only imports (Team.ts pulls in mongoose, which
 * breaks the browser bundle if a client component imports the constant from
 * there instead of here).
 */
// Seniority order (also the default display order on /team and the homepage): most senior first.
export const TEAM_CATEGORIES = ["Honorary Advisory Board", "Dosen", "Peneliti", "Peneliti Alumni", "Peneliti Mahasiswa"] as const;
