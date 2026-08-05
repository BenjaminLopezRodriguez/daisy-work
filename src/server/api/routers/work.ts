import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { evidence, submissions, users, workOrders } from "@/server/db/schema";
import { parseSearchFilters } from "@/server/orchestrator/search-filters";
import {
  createDbWorkOrderService,
  mapUser,
} from "@/server/services/db/work-order";
import {
  getServiceById,
  recordServiceClick,
} from "@/server/services/db/service-listing";
import { createOrchestratorModel } from "@/server/orchestrator/model/deepseek-orchestrator-model";
import { createDraftFromPlan } from "@/server/orchestrator";
import { notify } from "@/server/services/notify";
import {
  claimAdAttribution,
  refundEscrow,
  releaseEscrow,
} from "@/server/services/payments";
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

  updateAvatar: protectedProcedure
    .input(z.object({ avatarUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .update(users)
        .set({ avatar: input.avatarUrl, image: input.avatarUrl })
        .where(eq(users.id, ctx.session.user.id))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return mapUser(row);
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

      // Held funds go back. A cancelled job must never sit on someone's money.
      await refundEscrow(row.id);

      if (row.assigneeId) {
        await notify({
          userId: row.assigneeId,
          title: `Request cancelled: “${row.title}”`,
          body: "The customer cancelled this request.",
          href: `/work/${row.id}`,
        });
      }

      return { ok: true as const };
    }),

  /**
   * The customer signs off. Terminal state for the happy path, and the gate
   * that unlocks reviews in both directions.
   */
  approve: protectedProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const wo = await requireOwnedWorkOrder(
        input.workOrderId,
        ctx.session.user.id,
      );
      if (wo.status === "approved") return { ok: true as const };
      if (!wo.assigneeId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nobody is assigned to this job yet",
        });

      // Money first: if the transfer fails, the job must not read as approved
      // while the provider is unpaid.
      await releaseEscrow(wo.id);

      await ctx.db
        .update(workOrders)
        .set({ status: "approved" })
        .where(eq(workOrders.id, wo.id));

      await notify({
        userId: wo.assigneeId,
        title: `“${wo.title}” was approved`,
        body: "The customer approved your work. Leave them a review.",
        href: `/work/${wo.id}`,
      });

      return { ok: true as const };
    }),

  /**
   * Request a packaged service: publish the draft (if any) and assign the
   * service owner. Creates a short draft from title/description when no draftId.
   */
  requestService: protectedProcedure
    .input(
      z.object({
        serviceListingId: z.string().uuid(),
        draftId: z.string().uuid().optional(),
        title: z.string().trim().min(3).max(512).optional(),
        description: z.string().trim().min(3).optional(),
        category: z.string().trim().min(1).max(128).optional(),
        budgetAmount: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const listing = await getServiceById(input.serviceListingId);
      if (listing?.status !== "active") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }
      if (listing.ownerUserId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can’t request your own service",
        });
      }

      await recordServiceClick(listing.id);

      const services = createDbWorkOrderService();
      let workOrderId = input.draftId;

      if (workOrderId) {
        await requireOwnedWorkOrder(workOrderId, userId);
        await services.publish({ workOrderId });
      } else {
        const created = await services.createDraft({
          title: input.title ?? `Request: ${listing.title}`,
          description:
            input.description ??
            `Requested service: ${listing.title}\n\n${listing.description}`,
          requesterId: userId,
          category: input.category ?? listing.tags[0] ?? "general",
          workMode: "hybrid",
          budgetAmount: input.budgetAmount ?? listing.priceCents,
          currency: "USD",
        });
        workOrderId = created.id;
        await services.publish({ workOrderId });
      }

      const assigned = await services.assign({
        workOrderId,
        assigneeId: listing.ownerUserId,
        assigneeType: "human",
      });

      await claimAdAttribution({
        workOrderId: assigned.id,
        customerUserId: userId,
        providerUserId: listing.ownerUserId,
      }).catch((error) => console.error("[ads] attribution failed", error));

      await notify({
        userId: listing.ownerUserId,
        title: `New request for “${listing.title}”`,
        body: `${ctx.session.user.name ?? "Someone"} requested your service.`,
        href: `/work/${assigned.id}`,
      });

      return { workOrderId: assigned.id };
    }),

  /** Attach uploaded deliverable files to a draft submission for this job. */
  submitEvidence: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string().uuid(),
        files: z
          .array(
            z.object({
              url: z.string().url(),
              name: z.string().min(1).max(256),
              key: z.string().optional(),
            }),
          )
          .min(1)
          .max(8),
        notes: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [wo] = await db
        .select({
          id: workOrders.id,
          title: workOrders.title,
          requesterId: workOrders.requesterId,
          assigneeId: workOrders.assigneeId,
        })
        .from(workOrders)
        .where(eq(workOrders.id, input.workOrderId))
        .limit(1);
      if (!wo) throw new TRPCError({ code: "NOT_FOUND" });

      let [submission] = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.workOrderId, input.workOrderId),
            eq(submissions.submittedBy, userId),
            eq(submissions.status, "draft"),
          ),
        )
        .limit(1);

      if (!submission) {
        [submission] = await db
          .insert(submissions)
          .values({
            workOrderId: input.workOrderId,
            submittedBy: userId,
            status: "draft",
            notes: input.notes ?? "",
          })
          .returning();
      } else if (input.notes) {
        await db
          .update(submissions)
          .set({ notes: input.notes })
          .where(eq(submissions.id, submission.id));
      }

      if (!submission) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create submission",
        });
      }

      const rows = await db
        .insert(evidence)
        .values(
          input.files.map((file) => {
            const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(file.name);
            return {
              submissionId: submission.id,
              type: isImage ? ("image" as const) : ("document" as const),
              storageKey: file.key ?? file.url,
              caption: file.name,
              metadataJson: JSON.stringify({ url: file.url, name: file.name }),
            };
          }),
        )
        .returning();

      // Uploading the deliverable IS submitting it — a separate "now really
      // submit" button is a step users forget, leaving jobs stuck forever.
      if (wo.assigneeId === userId) {
        await db
          .update(workOrders)
          .set({ status: "submitted" })
          .where(eq(workOrders.id, wo.id));
      }

      if (wo.requesterId !== userId) {
        await notify({
          userId: wo.requesterId,
          title: `Work submitted on “${wo.title}”`,
          body: `${ctx.session.user.name ?? "The provider"} uploaded ${rows.length} file${rows.length === 1 ? "" : "s"} for review.`,
          href: `/work/${wo.id}`,
        });
      }

      return {
        submissionId: submission.id,
        evidenceIds: rows.map((r) => r.id),
      };
    }),
});

export const orchestratorRouter = createTRPCRouter({
  /**
   * Turns a plain-language search into filters. Public because browsing is.
   * Always resolves to something usable — falls back to a keyword heuristic
   * when the model is unavailable, and reports which was used.
   */
  parseSearchFilters: publicProcedure
    .input(z.object({ query: z.string().trim().min(1).max(300) }))
    .mutation(async ({ input }) => parseSearchFilters(input.query)),

  /**
   * Plans a job without writing anything, so someone can see their draft
   * before signing in. Persisting still requires an account — this only
   * returns the plan. Input is capped because it reaches a paid model.
   */
  planPreview: publicProcedure
    .input(z.object({ message: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const model = createOrchestratorModel();
      const result = await model.plan({ message: input.message, userId: null });
      if (result.kind !== "work_draft") return result;
      return {
        kind: "work_draft" as const,
        plan: result.plan,
        explanation: result.explanation,
      };
    }),

  /**
   * Persists a plan the caller already previewed. Lets the sign-in step come
   * last: draft first, account only when it is time to save.
   */
  createFromPlan: protectedProcedure
    .input(z.object({ plan: workPlanSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
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
        input.plan,
        userId,
      );
      return { draftId: created.draftId };
    }),

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
