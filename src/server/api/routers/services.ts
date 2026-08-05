import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  ensureWorkerProfileId,
  getServiceById,
  listActiveServices,
  listServicesForUser,
  matchServices,
  recordServiceClick,
  recordServiceView,
  upsertServiceListing,
} from "@/server/services/db/service-listing";
import { suggestServiceListing } from "@/server/orchestrator/service-suggest";

const serviceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(256),
  description: z.string().trim().max(2000).default(""),
  priceCents: z.number().int().min(0).max(100_000_00),
  coverImageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(64)).max(12).default([]),
  status: z.enum(["active", "paused"]).optional(),
});

export const servicesRouter = createTRPCRouter({
  /**
   * Drafts a listing from a short hint. Returns null when the model is
   * unavailable so the UI can say so instead of silently filling nothing.
   */
  suggest: protectedProcedure
    .input(z.object({ hint: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input }) => suggestServiceListing(input.hint)),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return listServicesForUser(ctx.session.user.id);
  }),

  listActive: publicProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(48).optional() })
        .optional(),
    )
    .query(async ({ input }) => listActiveServices(input?.limit ?? 24)),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => getServiceById(input.id)),

  match: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(2000),
        limit: z.number().int().min(1).max(16).optional(),
      }),
    )
    .query(async ({ input }) => matchServices(input.query, input.limit ?? 8)),

  upsert: protectedProcedure
    .input(serviceInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const profileId = await ensureWorkerProfileId(userId);
      if (!profileId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Create a provider profile before listing a service",
        });
      }
      return upsertServiceListing({
        id: input.id,
        ownerUserId: userId,
        workerProfileId: profileId,
        title: input.title,
        description: input.description,
        priceCents: input.priceCents,
        coverImageUrl: input.coverImageUrl,
        tags: input.tags,
        status: input.status,
      });
    }),

  recordView: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await recordServiceView(input.id);
      return { ok: true as const };
    }),

  recordClick: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await recordServiceClick(input.id);
      return { ok: true as const };
    }),
});
