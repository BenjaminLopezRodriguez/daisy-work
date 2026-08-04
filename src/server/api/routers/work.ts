import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  createDbWorkOrderService,
  ensureDemoUser,
} from "@/server/services/db/work-order";
import { createOrchestratorModel } from "@/server/orchestrator/model/deepseek-orchestrator-model";
import { createDraftFromPlan } from "@/server/orchestrator";
import { workPlanSchema } from "@/server/orchestrator/orchestrator.types";

export const meRouter = createTRPCRouter({
  get: publicProcedure.query(async () => ensureDemoUser()),
});

export const workRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    const user = await ensureDemoUser();
    return createDbWorkOrderService().listForUser(user.id);
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

  publish: publicProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return createDbWorkOrderService().publish(input);
    }),
});

export const orchestratorRouter = createTRPCRouter({
  planAndDraft: publicProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const user = await ensureDemoUser();
      const model = createOrchestratorModel();
      const result = await model.plan({
        message: input.message,
        userId: user.id,
      });
      if (result.kind !== "work_draft") return result;

      const services = createDbWorkOrderService();
      const created = await createDraftFromPlan(
        {
          userId: user.id,
          services: {
            createDraft: (draftInput) => services.createDraft(draftInput),
            publish: async (publishInput) => {
              await services.publish(publishInput);
            },
          },
        },
        result.plan,
        user.id,
      );

      return {
        kind: "work_draft" as const,
        plan: result.plan,
        explanation: result.explanation,
        draftId: created.draftId,
      };
    }),

  updateDraft: publicProcedure
    .input(
      z.object({
        draftId: z.string().uuid(),
        plan: workPlanSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { workOrders } = await import("@/server/db/schema");
      const { eq } = await import("drizzle-orm");
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
        .where(eq(workOrders.id, input.draftId))
        .returning();
      if (!row) throw new Error("Draft not found");
      return { ok: true as const };
    }),
});
