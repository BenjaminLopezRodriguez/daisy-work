import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  createAd,
  getAdForUser,
  listActiveAds,
  listAdsForUser,
  recordAdClick,
  recordAdImpressions,
  updateAd,
} from "@/server/services/db/ad";

const placementSchema = z.enum(["landing", "marketplace", "work_feed"]);

const adFields = z.object({
  advertiserType: z.enum(["worker", "company"]),
  companyName: z.string().trim().min(2).max(256).optional(),
  headline: z.string().trim().min(3).max(128),
  body: z.string().trim().max(500).default(""),
  imageUrl: z.string().url().nullable().optional(),
  ctaLabel: z.string().trim().min(2).max(64).default("Learn more"),
  ctaUrl: z
    .string()
    .trim()
    .min(1)
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Use a full URL or a path starting with /",
    ),
  placement: placementSchema.default("marketplace"),
});

export const adsRouter = createTRPCRouter({
  listActive: publicProcedure
    .input(
      z.object({
        placement: placementSchema,
        limit: z.number().int().min(1).max(12).optional(),
      }),
    )
    .query(async ({ input }) => {
      return listActiveAds(input.placement, input.limit ?? 6);
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return listAdsForUser(ctx.session.user.id);
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const ad = await getAdForUser(input.id, ctx.session.user.id);
      if (!ad) throw new TRPCError({ code: "NOT_FOUND" });
      return ad;
    }),

  create: protectedProcedure
    .input(adFields)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.advertiserType === "company" && !input.companyName?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Company name is required for company ads",
        });
      }

      return createAd({
        advertiserType: input.advertiserType,
        ownerUserId: userId,
        companyName:
          input.advertiserType === "company" ? input.companyName : null,
        headline: input.headline,
        body: input.body,
        imageUrl: input.imageUrl,
        ctaLabel: input.ctaLabel,
        ctaUrl: input.ctaUrl,
        placement: input.placement,
      });
    }),

  update: protectedProcedure
    .input(
      adFields.partial().extend({
        id: z.string().uuid(),
        status: z.enum(["active", "paused"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, advertiserType: _type, ...patch } = input;
      const updated = await updateAd({
        id,
        ownerUserId: ctx.session.user.id,
        ...patch,
      });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["active", "paused"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateAd({
        id: input.id,
        ownerUserId: ctx.session.user.id,
        status: input.status,
      });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  recordImpressions: publicProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).max(20) }))
    .mutation(async ({ input }) => {
      await recordAdImpressions(input.ids);
      return { ok: true as const };
    }),

  recordClick: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await recordAdClick(input.id);
      return { ok: true as const };
    }),
});
