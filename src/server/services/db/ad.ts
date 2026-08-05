import "server-only";

import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { advertisements } from "@/server/db/schema";

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
        or(
          isNull(advertisements.startsAt),
          lte(advertisements.startsAt, now),
        ),
        or(isNull(advertisements.endsAt), gte(advertisements.endsAt, now)),
      ),
    )
    .orderBy(desc(advertisements.createdAt))
    .limit(limit);

  return rows.map(mapRow);
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
      status: "active",
    })
    .returning();

  if (!row) throw new Error("Failed to create advertisement");
  return mapRow(row);
}

export type UpdateAdInput = {
  id: string;
  ownerUserId: string;
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
      and(
        eq(advertisements.id, id),
        eq(advertisements.ownerUserId, userId),
      ),
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
