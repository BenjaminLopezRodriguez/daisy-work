import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import { serviceListings } from "@/server/db/schema";
import { chatJson } from "./deepseek-json";

const suggestionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(1200),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  /** Integer cents. Never floats. */
  priceCents: z.number().int().min(0).max(100_000_00),
});

export type ServiceSuggestion = z.infer<typeof suggestionSchema> & {
  /**
   * What the price was anchored to. `null` when no comparable listings exist —
   * the UI must say so rather than implying a market rate we don't have.
   */
  priceBasis: { medianCents: number; sampleSize: number } | null;
};

const SYSTEM = `You help a service provider write their marketplace listing.
Return ONLY valid JSON:
{
  "title": "string — plain, specific, what they do. No marketing adjectives.",
  "description": "string — what's included, what's not, what the buyer should expect. 2-4 short paragraphs, plain language.",
  "tags": ["string"],
  "priceCents": number
}
Rules:
- Write as the provider, in first person, plainly. No hype, no superlatives, no invented credentials.
- Never claim licences, insurance, years of experience, or certifications the user did not state.
- priceCents is an integer in cents ($65 = 6500).
- If comparable listing prices are supplied, price within that range unless the described work is clearly different in scope. If none are supplied, choose a defensible common rate.`;

/** Median price of active listings that share a tag or title word with the hint. */
async function priceContext(
  hint: string,
): Promise<{ medianCents: number; sampleSize: number } | null> {
  const words = hint
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3)
    .slice(0, 6);
  if (words.length === 0) return null;

  const pattern = `%${words[0]}%`;
  const rows = await db
    .select({ priceCents: serviceListings.priceCents })
    .from(serviceListings)
    .where(
      and(
        eq(serviceListings.status, "active"),
        sql`(lower(${serviceListings.title}) like ${pattern} or exists (
          select 1 from unnest(${serviceListings.tags}) as t where lower(t) like ${pattern}
        ))`,
      ),
    )
    .limit(200);

  const prices = rows.map((r) => r.priceCents).filter((p) => p > 0).sort((a, b) => a - b);
  if (prices.length === 0) return null;

  const mid = Math.floor(prices.length / 2);
  const medianCents =
    prices.length % 2 === 0
      ? Math.round(((prices[mid - 1] ?? 0) + (prices[mid] ?? 0)) / 2)
      : (prices[mid] ?? 0);

  return { medianCents, sampleSize: prices.length };
}

/**
 * Drafts a service listing from a short hint. Returns null when the model is
 * unavailable — the caller keeps whatever the provider already typed rather
 * than overwriting it with a guess.
 */
export async function suggestServiceListing(
  hint: string,
): Promise<ServiceSuggestion | null> {
  const trimmed = hint.trim();
  if (trimmed.length < 3) return null;

  const basis = await priceContext(trimmed);
  const context = basis
    ? `Comparable active listings: ${basis.sampleSize}, median price ${basis.medianCents} cents.`
    : "No comparable listings exist yet on this marketplace.";

  const suggestion = await chatJson({
    system: SYSTEM,
    user: `${trimmed}\n\n${context}`,
    schema: suggestionSchema,
    temperature: 0.4,
  });
  if (!suggestion) return null;

  return { ...suggestion, tags: suggestion.tags ?? [], priceBasis: basis };
}
