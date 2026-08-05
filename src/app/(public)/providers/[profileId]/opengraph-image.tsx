import { eq } from "drizzle-orm";

import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";
import { db } from "@/server/db";
import { users, workerProfiles } from "@/server/db/schema";

export const alt = "Provider on Daisy.work";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const [row] = await db
    .select({
      name: users.name,
      headline: workerProfiles.headline,
      location: workerProfiles.location,
    })
    .from(workerProfiles)
    .innerJoin(users, eq(users.id, workerProfiles.userId))
    .where(eq(workerProfiles.id, profileId))
    .limit(1);

  return ogCard({
    eyebrow: "Provider",
    title: row?.name ?? "Provider not found",
    meta: row
      ? [row.headline, row.location].filter(Boolean).join(" · ")
      : undefined,
  });
}
