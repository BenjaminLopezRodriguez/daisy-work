import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { serviceListings, users, workerProfiles } from "@/server/db/schema";

export type ServiceListing = {
  id: string;
  workerProfileId: string;
  ownerUserId: string;
  title: string;
  description: string;
  priceCents: number;
  coverImageUrl: string | null;
  tags: string[];
  status: "active" | "paused";
  viewCount: number;
  clickCount: number;
  createdAt: Date;
  ownerName?: string;
  ownerAvatar?: string | null;
};

function mapRow(
  row: typeof serviceListings.$inferSelect,
  extra?: { ownerName?: string; ownerAvatar?: string | null },
): ServiceListing {
  return {
    id: row.id,
    workerProfileId: row.workerProfileId,
    ownerUserId: row.ownerUserId,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    coverImageUrl: row.coverImageUrl,
    tags: row.tags,
    status: row.status,
    viewCount: row.viewCount,
    clickCount: row.clickCount,
    createdAt: row.createdAt,
    ownerName: extra?.ownerName,
    ownerAvatar: extra?.ownerAvatar,
  };
}

export type UpsertServiceInput = {
  id?: string;
  ownerUserId: string;
  workerProfileId: string;
  title: string;
  description: string;
  priceCents: number;
  coverImageUrl?: string | null;
  tags?: string[];
  status?: "active" | "paused";
};

export async function upsertServiceListing(
  input: UpsertServiceInput,
): Promise<ServiceListing> {
  if (input.id) {
    const [row] = await db
      .update(serviceListings)
      .set({
        title: input.title,
        description: input.description,
        priceCents: input.priceCents,
        coverImageUrl: input.coverImageUrl ?? null,
        tags: input.tags ?? [],
        status: input.status ?? "active",
      })
      .where(
        and(
          eq(serviceListings.id, input.id),
          eq(serviceListings.ownerUserId, input.ownerUserId),
        ),
      )
      .returning();
    if (!row) throw new Error("Service not found");
    return mapRow(row);
  }

  const [row] = await db
    .insert(serviceListings)
    .values({
      workerProfileId: input.workerProfileId,
      ownerUserId: input.ownerUserId,
      title: input.title,
      description: input.description,
      priceCents: input.priceCents,
      coverImageUrl: input.coverImageUrl ?? null,
      tags: input.tags ?? [],
      status: input.status ?? "active",
    })
    .returning();
  if (!row) throw new Error("Failed to create service");
  return mapRow(row);
}

export async function listServicesForUser(
  userId: string,
): Promise<ServiceListing[]> {
  const rows = await db
    .select()
    .from(serviceListings)
    .where(eq(serviceListings.ownerUserId, userId))
    .orderBy(desc(serviceListings.createdAt));
  return rows.map((r) => mapRow(r));
}

export async function listActiveServices(
  limit = 24,
): Promise<ServiceListing[]> {
  const rows = await db
    .select({
      listing: serviceListings,
      name: users.name,
      avatar: users.avatar,
      image: users.image,
    })
    .from(serviceListings)
    .innerJoin(users, eq(users.id, serviceListings.ownerUserId))
    .where(eq(serviceListings.status, "active"))
    .orderBy(desc(serviceListings.createdAt))
    .limit(limit);

  return rows.map((r) =>
    mapRow(r.listing, {
      ownerName: r.name,
      ownerAvatar: r.avatar ?? r.image,
    }),
  );
}

export async function getServiceById(
  id: string,
): Promise<ServiceListing | null> {
  const [row] = await db
    .select({
      listing: serviceListings,
      name: users.name,
      avatar: users.avatar,
      image: users.image,
    })
    .from(serviceListings)
    .innerJoin(users, eq(users.id, serviceListings.ownerUserId))
    .where(eq(serviceListings.id, id))
    .limit(1);
  if (!row) return null;
  return mapRow(row.listing, {
    ownerName: row.name,
    ownerAvatar: row.avatar ?? row.image,
  });
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

/** Score active services against a brief (title + summary + category). */
export async function matchServices(
  query: string,
  limit = 8,
): Promise<ServiceListing[]> {
  const tokens = new Set(tokenize(query));
  const all = await listActiveServices(48);
  if (tokens.size === 0) return all.slice(0, limit);

  const scored = all
    .map((s) => {
      const hay = tokenize(
        `${s.title} ${s.description} ${s.tags.join(" ")}`,
      );
      let score = 0;
      for (const t of hay) {
        if (tokens.has(t)) score += 1;
      }
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return all.slice(0, limit);
  return scored.slice(0, limit).map((x) => x.s);
}

export async function recordServiceView(id: string): Promise<void> {
  await db
    .update(serviceListings)
    .set({ viewCount: sql`${serviceListings.viewCount} + 1` })
    .where(eq(serviceListings.id, id));
}

export async function recordServiceClick(id: string): Promise<void> {
  await db
    .update(serviceListings)
    .set({ clickCount: sql`${serviceListings.clickCount} + 1` })
    .where(eq(serviceListings.id, id));
}

export async function ensureWorkerProfileId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: workerProfiles.id })
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, userId))
    .limit(1);
  return row?.id ?? null;
}
