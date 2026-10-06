/**
 * Shared with client components (e.g. the Join form), so this must stay free
 * of any server-only imports - see the same note on models/teamCategories.ts.
 * Sourced from Telkom University's official faculty list (smb.telkomuniversity.ac.id/fakultas/).
 */
export const MEMBER_FACULTIES = [
  "Fakultas Teknik Elektro (FTE)",
  "Fakultas Rekayasa Industri (FRI)",
  "Fakultas Informatika (FIF)",
  "Fakultas Ekonomi dan Bisnis (FEB)",
  "Fakultas Industri Kreatif (FIK)",
  "Fakultas Ilmu Terapan (FIT)",
  "Fakultas Komunikasi dan Ilmu Sosial (FKS)",
] as const;
