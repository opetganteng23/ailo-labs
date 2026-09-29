/**
 * Shared with client components (e.g. the public /join form), so this must
 * stay free of any server-only imports (Member.ts pulls in mongoose, which
 * breaks the browser bundle if a client component imports the constant from
 * there instead of here).
 */
export const MEMBER_CATEGORIES = ["Dosen", "Peneliti", "Peneliti Mahasiswa", "Peneliti Alumni", "Honorary Advisory Board"] as const;
