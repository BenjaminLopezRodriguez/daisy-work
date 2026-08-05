import "server-only";

import { z } from "zod";

import { chatJson } from "./deepseek-json";

export const searchFiltersSchema = z.object({
  /** What's left of the query once filters are extracted; drives text search. */
  q: z.string().trim().max(200).optional(),
  cat: z.string().trim().max(64).optional(),
  mode: z.enum(["remote", "on_site", "hybrid"]).optional(),
  /** Integer cents. Never floats. */
  min: z.number().int().min(0).max(100_000_00).optional(),
  max: z.number().int().min(0).max(100_000_00).optional(),
  sort: z.enum(["recent", "price_asc", "price_desc"]).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

const SYSTEM = `You turn a plain-language marketplace search into filters.
Return ONLY valid JSON:
{
  "q": "string — the remaining search words after filters are removed; omit if nothing remains",
  "cat": "string — a job category like electrical, plumbing, web design; omit if not implied",
  "mode": "remote" | "on_site" | "hybrid",
  "min": number,  // integer cents
  "max": number,  // integer cents
  "sort": "recent" | "price_asc" | "price_desc"
}
Rules:
- Omit any key you are not confident about. Omitting is always better than guessing.
- Money is integer cents: $500 is 50000.
- "cheap", "budget", "affordable" imply sort=price_asc, not a max — unless a number is given.
- "near me", "on site", "in person" imply mode=on_site. "remote", "online" imply remote.
- Never invent a category that the words do not support.
- q is what a keyword search should still match, with filter words stripped.`;

/** Cheap deterministic pass, used when the model is unavailable or unsure. */
export function heuristicFilters(query: string): SearchFilters {
  const text = query.toLowerCase();
  const filters: SearchFilters = {};

  if (/\b(remote|online|from home)\b/.test(text)) filters.mode = "remote";
  else if (/\b(on ?site|in person|near me|local)\b/.test(text))
    filters.mode = "on_site";
  else if (/\bhybrid\b/.test(text)) filters.mode = "hybrid";

  if (/\b(cheap|cheapest|budget|affordable|low cost)\b/.test(text))
    filters.sort = "price_asc";
  else if (/\b(premium|high end|best paid|highest)\b/.test(text))
    filters.sort = "price_desc";

  // "under $500" / "over 200" → cents.
  const under = /\b(?:under|below|less than|max)\s*\$?\s*(\d[\d,]*)/.exec(text);
  const over = /\b(?:over|above|more than|min|at least)\s*\$?\s*(\d[\d,]*)/.exec(
    text,
  );
  if (under?.[1]) filters.max = Number(under[1].replace(/,/g, "")) * 100;
  if (over?.[1]) filters.min = Number(over[1].replace(/,/g, "")) * 100;

  const rest = query.trim();
  if (rest) filters.q = rest.slice(0, 200);
  return filters;
}

/**
 * Reads a plain-language query and returns filters to apply.
 * Falls back to {@link heuristicFilters} whenever the model can't be reached or
 * returns something unusable, so search always does something sensible.
 */
export async function parseSearchFilters(
  query: string,
): Promise<{ filters: SearchFilters; source: "model" | "heuristic" }> {
  const trimmed = query.trim();
  if (!trimmed) return { filters: {}, source: "heuristic" };

  const parsed = await chatJson({
    system: SYSTEM,
    user: trimmed,
    schema: searchFiltersSchema,
  });

  if (!parsed) return { filters: heuristicFilters(trimmed), source: "heuristic" };

  // A min above max is nonsense; drop both rather than return an empty result set.
  if (parsed.min !== undefined && parsed.max !== undefined && parsed.min > parsed.max) {
    delete parsed.min;
    delete parsed.max;
  }
  return { filters: parsed, source: "model" };
}
