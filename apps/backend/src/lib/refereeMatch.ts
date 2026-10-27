import { normalizeName } from "@/lib/memberDuplicate";

/** Titles and degrees that don't help tell two people apart ("Prof. Dr. Suyanto, S.T., M.Sc." -> "suyanto"). */
const NOISE = new Set(["prof", "dr", "drs", "dra", "ir", "h", "hj", "st", "mt", "msc", "mkom", "skom", "sti", "phd", "ph", "d", "mm", "se", "sh", "mh", "mti", "dipl", "ing", "eng", "bsc", "meng", "beng", "mcs"]);

function tokens(name: string) {
  return normalizeName(name)
    .split(" ")
    .filter((t) => t.length >= 3 && !NOISE.has(t));
}

/** True when the typed referee clearly points at this person: every distinctive word of it appears in their name. */
export function refereeMatches(referee: string | undefined, fullName: string): boolean {
  if (!referee) return false;
  const wanted = tokens(referee);
  if (wanted.length === 0) return false;
  const have = new Set(tokens(fullName));
  return wanted.every((t) => have.has(t));
}
