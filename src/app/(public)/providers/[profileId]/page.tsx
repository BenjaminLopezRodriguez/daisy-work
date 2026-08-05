import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { NOT_FOUND_METADATA, detailMetadata } from "@/lib/share-meta";
import { db } from "@/server/db";
import { users, workerProfiles } from "@/server/db/schema";

import ProviderPublicPage from "./provider-public";

async function loadProfile(profileId: string) {
  const [row] = await db
    .select({
      name: users.name,
      headline: workerProfiles.headline,
      biography: workerProfiles.biography,
      location: workerProfiles.location,
    })
    .from(workerProfiles)
    .innerJoin(users, eq(users.id, workerProfiles.userId))
    .where(eq(workerProfiles.id, profileId))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  const profile = await loadProfile(profileId);
  if (!profile) return NOT_FOUND_METADATA;

  return detailMetadata({
    title: `${profile.name} · ${profile.headline}`,
    description:
      profile.biography ||
      `${profile.name} offers services on Daisy.work${profile.location ? ` in ${profile.location}` : ""}.`,
    path: `/providers/${profileId}`,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  return <ProviderPublicPage profileId={profileId} />;
}
