import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { users, workOrders } from "@/server/db/schema";
import {
  createDbWorkOrderService,
  mapUser,
} from "@/server/services/db/work-order";
import { createOrchestratorModel } from "@/server/orchestrator/model/deepseek-orchestrator-model";
import { createDraftFromPlan } from "@/server/orchestrator";
import { workPlanSchema } from "@/server/orchestrator/orchestrator.types";

/** Loads a work order the given user owns, or throws. */
async function requireOwnedWorkOrder(workOrderId: string, userId: string) {
  const [row] = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.id, workOrderId))
    .limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND" });
  if (row.requesterId !== userId) throw new TRPCError({ code: "FORBIDDEN" });
  return row;
}

export const meRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return null;
    const [row] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row ? mapUser(row) : null;
  }),
});

export const workRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return createDbWorkOrderService().listForUser(ctx.session.user.id);
  }),

  browse: publicProcedure
    .input(z.object({ q: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const jobs = await createDbWorkOrderService().listPublished();
      const q = input?.q?.trim().toLowerCase();
      if (!q) return jobs;
      return jobs.filter(
        (wo) =>
          wo.title.toLowerCase().includes(q) ||
          wo.description.toLowerCase().includes(q) ||
          wo.category.toLowerCase().includes(q),
      );
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return createDbWorkOrderService().getById(input.id);
    }),

  publish: protectedProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedWorkOrder(input.workOrderId, ctx.session.user.id);
      return createDbWorkOrderService().publish(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string().uuid(),
        title: z.string().min(1).max(512).optional(),
        description: z.string().min(1).optional(),
        category: z.string().min(1).max(128).optional(),
        /** Integer minor units (cents). */
        budgetAmount: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await requireOwnedWorkOrder(input.workOrderId, userId);
      const { workOrderId, ...patch } = input;
      const [row] = await ctx.db
        .update(workOrders)
        .set(patch)
        .where(
          and(
            eq(workOrders.id, workOrderId),
            eq(workOrders.requesterId, userId),
          ),
        )
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),

  cancel: protectedProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await requireOwnedWorkOrder(input.workOrderId, userId);
      const [row] = await ctx.db
        .update(workOrders)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(workOrders.id, input.workOrderId),
            eq(workOrders.requesterId, userId),
          ),
        )
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),
});

export const orchestratorRouter = createTRPCRouter({
  planAndDraft: protectedProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const model = createOrchestratorModel();
      const result = await model.plan({ message: input.message, userId });
      if (result.kind !== "work_draft") return result;

      const services = createDbWorkOrderService();
      const created = await createDraftFromPlan(
        {
          userId,
          services: {
            createDraft: (draftInput) => services.createDraft(draftInput),
            publish: async (publishInput) => {
              await services.publish(publishInput);
            },
          },
        },
        result.plan,
        userId,
      );

      return {
        kind: "work_draft" as const,
        plan: result.plan,
        explanation: result.explanation,
        draftId: created.draftId,
      };
    }),

  updateDraft: protectedProcedure
    .input(
      z.object({
        draftId: z.string().uuid(),
        plan: workPlanSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await requireOwnedWorkOrder(input.draftId, userId);
      const [row] = await ctx.db
        .update(workOrders)
        .set({
          title: input.plan.title,
          description: input.plan.summary,
          category: input.plan.category,
          workMode: input.plan.workMode,
          budgetAmount: input.plan.budgetAmount,
          currency: input.plan.currency,
        })
        .where(
          and(
            eq(workOrders.id, input.draftId),
            eq(workOrders.requesterId, userId),
          ),
        )
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),
});
