export type FiveW1H = {
  what: string;
  who: string;
  when: string;
  where: string;
  why: string;
  how: string;
};

/**
 * Formats raw 5W+1H fields into a readable draft article body.
 *
 * TODO: replace with a real LLM call (e.g. Anthropic Messages API) once an
 * API key is configured, to turn these fields into fluent prose instead of
 * this deterministic template. This local fallback keeps the news pipeline
 * fully functional (real data is persisted) without any external API key.
 */
export function formatDraftFromFiveW1H(input: FiveW1H): string {
  const paragraphs = [
    `${input.what}`.trim(),
    `Melibatkan: ${input.who}`.trim(),
    `Waktu: ${input.when}`.trim(),
    `Lokasi: ${input.where}`.trim(),
    `Latar belakang: ${input.why}`.trim(),
    `Detail pelaksanaan: ${input.how}`.trim(),
  ].filter((line) => line.replace(/^(Melibatkan|Waktu|Lokasi|Latar belakang|Detail pelaksanaan):\s*/, "").length > 0);

  return paragraphs.join("\n\n");
}
