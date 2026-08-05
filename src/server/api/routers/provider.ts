import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { users, workerProfiles } from "@/server/db/schema";

const workModeValues = ["remote", "local", "on_site", "hybrid"] as const;

/** Hourly rate is integer cents. Never floats. */
const profileInput = z.object({
  headline: z.string().trim().min(3).max(256),
  biography: z.string().trim().max(2000).default(""),
  serviceAreas: z.array(z.string().trim().min(1).max(64)).max(12).default([]),
  workModes: z.array(z.enum(workModeValues)).min(1).max(4),
  hourlyRateCents: z.number().int().min(0).max(100_000_00).nullable(),
  location: z.string().trim().max(256).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
});

export const providerRouter = createTRPCRouter({
  /** What the user is here to do, plus their profile if they have one. */
  status: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [user] = await db
      .select({ onboardingChoice: users.onboardingChoice })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const [profile] = await db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, userId))
      .limit(1);
    return {
      choice: user?.onboardingChoice ?? null,
      profile: profile ?? null,
    };
  }),

  /** Own reach stats for account dashboard. */
  myReach: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select({
        profileViewCount: workerProfiles.profileViewCount,
        profileClickCount: workerProfiles.profileClickCount,
        headline: workerProfiles.headline,
        coverImageUrl: workerProfiles.coverImageUrl,
      })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, ctx.session.user.id))
      .limit(1);
    return profile ?? null;
  }),

  /** Public marketplace directory of providers. */
  listPublic: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(48).optional() }).optional())
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: workerProfiles.id,
          userId: workerProfiles.userId,
          headline: workerProfiles.headline,
          biography: workerProfiles.biography,
          serviceAreas: workerProfiles.serviceAreas,
          workModes: workerProfiles.workModes,
          hourlyRate: workerProfiles.hourlyRate,
          location: workerProfiles.location,
          coverImageUrl: workerProfiles.coverImageUrl,
          name: users.name,
          avatar: users.avatar,
          image: users.image,
        })
        .from(workerProfiles)
        .innerJoin(users, eq(users.id, workerProfiles.userId))
        .orderBy(desc(workerProfiles.updatedAt))
        .limit(input?.limit ?? 24);

      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        headline: r.headline,
        biography: r.biography,
        serviceAreas: r.serviceAreas,
        workModes: r.workModes,
        hourlyRate: r.hourlyRate,
        location: r.location,
        coverImageUrl: r.coverImageUrl,
        name: r.name,
        avatar: r.avatar ?? r.image,
      }));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          id: workerProfiles.id,
          userId: workerProfiles.userId,
          headline: workerProfiles.headline,
          biography: workerProfiles.biography,
          serviceAreas: workerProfiles.serviceAreas,
          workModes: workerProfiles.workModes,
          hourlyRate: workerProfiles.hourlyRate,
          location: workerProfiles.location,
          coverImageUrl: workerProfiles.coverImageUrl,
          name: users.name,
          avatar: users.avatar,
          image: users.image,
        })
        .from(workerProfiles)
        .innerJoin(users, eq(users.id, workerProfiles.userId))
        .where(eq(workerProfiles.id, input.id))
        .limit(1);
      if (!row) return null;
      return {
        ...row,
        avatar: row.avatar ?? row.image,
      };
    }),

  recordView: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db
        .update(workerProfiles)
        .set({
          profileViewCount: sql`${workerProfiles.profileViewCount} + 1`,
        })
        .where(eq(workerProfiles.id, input.id));
      return { ok: true as const };
    }),

  recordClick: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db
        .update(workerProfiles)
        .set({
          profileClickCount: sql`${workerProfiles.profileClickCount} + 1`,
        })
        .where(eq(workerProfiles.id, input.id));
      return { ok: true as const };
    }),

  /** Records the answer to the one question we ask after first sign-in. */
  setIntent: protectedProcedure
    .input(z.object({ choice: z.enum(["hire", "provide"]) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ onboardingChoice: input.choice })
        .where(eq(users.id, ctx.session.user.id));
      return { choice: input.choice };
    }),

  /** Creates or edits the caller's own provider profile. */
  upsertProfile: protectedProcedure
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const values = {
        headline: input.headline,
        biography: input.biography,
        serviceAreas: input.serviceAreas,
        workModes: input.workModes,
        hourlyRate: input.hourlyRateCents,
        location: input.location ?? null,
        ...(input.coverImageUrl !== undefined
          ? { coverImageUrl: input.coverImageUrl }
          : {}),
      };

      const [row] = await db
        .insert(workerProfiles)
        .values({ userId, ...values })
        .onConflictDoUpdate({
          target: workerProfiles.userId,
          set: values,
        })
        .returning();

      await db
        .update(users)
        .set({ onboardingChoice: "provide" })
        .where(eq(users.id, userId));

      return row;
    }),
});
