import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { payments, workerProfiles, workOrders } from "@/server/db/schema";
import {
  ensureConnectAccount,
  onboardingLink,
  syncPayoutStatus,
} from "@/server/services/payments/connect";
import { openEscrow } from "@/server/services/payments";
import { feeBps, paymentsConfigured } from "@/server/services/payments/stripe";
import { platformFee } from "@/server/services/payments/escrow";

function requirePayments() {
  if (!paymentsConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Payments are not configured on this deployment",
    });
  }
}

export const paymentRouter = createTRPCRouter({
  /** So the UI can show a fee breakdown before anyone commits. */
  quote: publicProcedure
    .input(z.object({ amountCents: z.number().int().min(0) }))
    .query(({ input }) => {
      const fee = platformFee(input.amountCents, feeBps());
      return {
        amount: input.amountCents,
        platformFee: fee,
        providerReceives: input.amountCents - fee,
        feeBps: feeBps(),
      };
    }),

  /** Payout readiness for the signed-in provider. */
  payoutStatus: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select({
        stripeAccountId: workerProfiles.stripeAccountId,
        payoutsEnabled: workerProfiles.payoutsEnabled,
      })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, ctx.session.user.id))
      .limit(1);

    return {
      hasProfile: Boolean(profile),
      started: Boolean(profile?.stripeAccountId),
      enabled: Boolean(profile?.payoutsEnabled),
      configured: paymentsConfigured(),
    };
  }),

  /** Fresh Stripe-hosted onboarding link. Single use, expires in minutes. */
  startOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    requirePayments();
    try {
      const url = await onboardingLink(ctx.session.user.id);
      return { url };
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          error instanceof Error ? error.message : "Could not start onboarding",
      });
    }
  }),

  /**
   * Pull the truth from Stripe rather than waiting on webhook delivery, so a
   * provider returning from onboarding sees the real state immediately.
   */
  refreshPayoutStatus: protectedProcedure.mutation(async ({ ctx }) => {
    requirePayments();
    const accountId = await ensureConnectAccount(ctx.session.user.id);
    return { enabled: await syncPayoutStatus(accountId) };
  }),

  /**
   * Open escrow for a job the caller owns. Returns the client secret the
   * checkout sheet confirms against.
   */
  checkout: protectedProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      requirePayments();
      const [wo] = await ctx.db
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, input.workOrderId))
        .limit(1);

      if (!wo) throw new TRPCError({ code: "NOT_FOUND" });
      if (wo.requesterId !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      if (!wo.assigneeId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hire someone before paying",
        });

      try {
        return await openEscrow({
          workOrderId: wo.id,
          customerUserId: wo.requesterId,
          providerUserId: wo.assigneeId,
          amountCents: wo.budgetAmount,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "";
        const message =
          reason === "NO_AMOUNT"
            ? "This job has no budget set"
            : reason === "PROVIDER_CANNOT_RECEIVE"
              ? "This provider has not finished payout setup yet"
              : reason === "ALREADY_PAID"
                ? "This job is already paid for"
                : "Could not start payment";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
    }),

  /** Money state for a work order, for both sides of the job. */
  forWorkOrder: protectedProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [wo] = await ctx.db
        .select({
          requesterId: workOrders.requesterId,
          assigneeId: workOrders.assigneeId,
        })
        .from(workOrders)
        .where(eq(workOrders.id, input.workOrderId))
        .limit(1);

      if (!wo) throw new TRPCError({ code: "NOT_FOUND" });
      const me = ctx.session.user.id;
      if (me !== wo.requesterId && me !== wo.assigneeId)
        throw new TRPCError({ code: "FORBIDDEN" });

      const [payment] = await ctx.db
        .select({
          status: payments.status,
          amount: payments.amount,
          platformFeeAmount: payments.platformFeeAmount,
          authorizedAt: payments.authorizedAt,
          releasedAt: payments.releasedAt,
        })
        .from(payments)
        .where(eq(payments.workOrderId, input.workOrderId))
        .limit(1);

      return payment ?? null;
    }),
});
