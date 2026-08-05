import "server-only";

import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { adAttributions, advertisements } from "@/server/db/schema";
import { rankAds } from "@/server/services/ads/auction";

export type AdPlacement = "landing" | "marketplace" | "work_feed";
export type AdAdvertiserType = "worker" | "company";

export type Advertisement = {
  id: string;
  advertiserType: AdAdvertiserType;
  ownerUserId: string | null;
  companyName: string | null;
  headline: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string;
  placement: AdPlacement;
  status: "active" | "paused";
  impressionCount: number;
  clickCount: number;
  costPerHireCents: number;
  budgetCents: number;
  spentCents: number;
  hireCount: number;
  createdAt: Date;
};

function mapRow(row: typeof advertisements.$inferSelect): Advertisement {
  return {
    id: row.id,
    advertiserType: row.advertiserType,
    ownerUserId: row.ownerUserId,
    companyName: row.companyName,
    headline: row.headline,
    body: row.body,
    imageUrl: row.imageUrl,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    placement: row.placement,
    status: row.status,
    impressionCount: row.impressionCount,
    clickCount: row.clickCount,
    costPerHireCents: row.costPerHireCents,
    budgetCents: row.budgetCents,
    spentCents: row.spentCents,
    hireCount: row.hireCount,
    createdAt: row.createdAt,
  };
}

export async function listActiveAds(
  placement: AdPlacement,
  limit = 6,
): Promise<Advertisement[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(advertisements)
    .where(
      and(
        eq(advertisements.placement, placement),
        eq(advertisements.status, "active"),
        or(isNull(advertisements.startsAt), lte(advertisements.startsAt, now)),
        or(isNull(advertisements.endsAt), gte(advertisements.endsAt, now)),
      ),
    )
    // Over-fetch: the auction, not the database, decides the final order and
    // drops anything that can no longer pay for a hire.
    .orderBy(desc(advertisements.createdAt))
    .limit(limit * 4);

  return rankAds(rows.map(mapRow), limit);
}

export type CreateAdInput = {
  advertiserType: AdAdvertiserType;
  ownerUserId: string | null;
  companyName?: string | null;
  headline: string;
  body: string;
  imageUrl?: string | null;
  ctaLabel: string;
  ctaUrl: string;
  placement: AdPlacement;
  /** Integer cents. What a hire from this ad is worth to the advertiser. */
  costPerHireCents: number;
  /** Integer cents. Total spend cap before the ad auto-pauses. */
  budgetCents: number;
};

export async function createAd(input: CreateAdInput): Promise<Advertisement> {
  const [row] = await db
    .insert(advertisements)
    .values({
      advertiserType: input.advertiserType,
      ownerUserId: input.ownerUserId,
      companyName: input.companyName ?? null,
      headline: input.headline,
      body: input.body,
      imageUrl: input.imageUrl ?? null,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      placement: input.placement,
      costPerHireCents: input.costPerHireCents,
      budgetCents: input.budgetCents,
      status: "active",
    })
    .returning();

  if (!row) throw new Error("Failed to create advertisement");
  return mapRow(row);
}

export type UpdateAdInput = {
  id: string;
  ownerUserId: string;
  costPerHireCents?: number;
  budgetCents?: number;
  companyName?: string | null;
  headline?: string;
  body?: string;
  imageUrl?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
  placement?: AdPlacement;
  status?: "active" | "paused";
};

export async function updateAd(
  input: UpdateAdInput,
): Promise<Advertisement | null> {
  const { id, ownerUserId, ...patch } = input;
  const [row] = await db
    .update(advertisements)
    .set(patch)
    .where(
      and(
        eq(advertisements.id, id),
        eq(advertisements.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  return row ? mapRow(row) : null;
}

export async function getAdForUser(
  id: string,
  userId: string,
): Promise<Advertisement | null> {
  const [row] = await db
    .select()
    .from(advertisements)
    .where(
      and(eq(advertisements.id, id), eq(advertisements.ownerUserId, userId)),
    )
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function listAdsForUser(userId: string): Promise<Advertisement[]> {
  const rows = await db
    .select()
    .from(advertisements)
    .where(eq(advertisements.ownerUserId, userId))
    .orderBy(desc(advertisements.createdAt));
  return rows.map(mapRow);
}

export async function recordAdImpressions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  for (const id of ids) {
    await db
      .update(advertisements)
      .set({
        impressionCount: sql`${advertisements.impressionCount} + 1`,
      })
      .where(eq(advertisements.id, id));
  }
}

export async function recordAdClick(id: string): Promise<void> {
  await db
    .update(advertisements)
    .set({ clickCount: sql`${advertisements.clickCount} + 1` })
    .where(eq(advertisements.id, id));
}

/**
 * Record who clicked, so a later hire of the same advertiser can be billed to
 * this ad. Self-clicks are ignored — an advertiser cannot bill themselves, and
 * would have no reason to other than to game their own conversion rate.
 */
export async function recordAdAttribution(
  advertisementId: string,
  viewerUserId: string,
): Promise<void> {
  const [ad] = await db
    .select({ ownerUserId: advertisements.ownerUserId })
    .from(advertisements)
    .where(eq(advertisements.id, advertisementId))
    .limit(1);

  if (!ad?.ownerUserId || ad.ownerUserId === viewerUserId) return;

  await db.insert(adAttributions).values({
    advertisementId,
    viewerUserId,
    advertiserUserId: ad.ownerUserId,
  });
}
