import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
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
      };

      const [row] = await db
        .insert(workerProfiles)
        .values({ userId, ...values })
        .onConflictDoUpdate({
          target: workerProfiles.userId,
          set: values,
        })
        .returning();

      // Setting up a profile is itself the answer to the intent question.
      await db
        .update(users)
        .set({ onboardingChoice: "provide" })
        .where(eq(users.id, userId));

      return row;
    }),
});
