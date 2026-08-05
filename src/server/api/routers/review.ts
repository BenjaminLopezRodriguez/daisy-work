import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { reviews, users, workOrders } from "@/server/db/schema";
import { notify } from "@/server/services/notify";

export const reviewRouter = createTRPCRouter({
  /** Public: what other people said about this person. */
  forUser: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) =>
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          authorName: users.name,
          authorAvatar: users.avatar,
          jobTitle: workOrders.title,
        })
        .from(reviews)
        .innerJoin(users, eq(users.id, reviews.reviewerId))
        .innerJoin(workOrders, eq(workOrders.id, reviews.workOrderId))
        .where(eq(reviews.subjectId, input.userId))
        .orderBy(desc(reviews.createdAt))
        .limit(20),
    ),

  /** What the caller still owes a review on, so the UI can prompt. */
  mineForJob: protectedProcedure
    .input(z.object({ workOrderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Scoped to job AND caller: the two sides review the same job separately.
      const [mine] = await ctx.db
        .select({ id: reviews.id, rating: reviews.rating })
        .from(reviews)
        .where(
          and(
            eq(reviews.workOrderId, input.workOrderId),
            eq(reviews.reviewerId, ctx.session.user.id),
          ),
        )
        .limit(1);
      return { mine: mine ?? null };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;
      const [job] = await ctx.db
        .select()
        .from(workOrders)
        .where(eq(workOrders.id, input.workOrderId))
        .limit(1);

      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      // Only the two people who did the job, and only once it is finished.
      if (job.status !== "approved")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can review a job once it has been approved",
        });

      const subjectId =
        authorId === job.requesterId
          ? job.assigneeId
          : authorId === job.assigneeId
            ? job.requesterId
            : null;
      if (!subjectId)
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your job" });

      const [inserted] = await ctx.db
        .insert(reviews)
        .values({
          workOrderId: input.workOrderId,
          reviewerId: authorId,
          subjectId,
          rating: input.rating,
          comment: input.comment,
        })
        .onConflictDoNothing()
        .returning();

      if (!inserted)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already reviewed this job",
        });

      await notify({
        userId: subjectId,
        title: `${ctx.session.user.name ?? "Someone"} left you a ${input.rating}-star review`,
        body: input.comment || `On “${job.title}”.`,
        href: `/work/${job.id}`,
      });

      return { ok: true as const };
    }),
});
