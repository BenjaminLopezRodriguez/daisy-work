import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  applyDenialReason,
  getJobForApply,
  insertApplication,
  listApplicationsForApplicant,
  listApplicationsForJob,
} from "@/server/services/db/application";

const workOrderIdInput = z.object({ workOrderId: z.string().uuid() });

export const applicationRouter = createTRPCRouter({
  /** Idempotent — applying twice returns the existing application. */
  submit: protectedProcedure
    .input(
      workOrderIdInput.extend({
        message: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const job = await getJobForApply(input.workOrderId);
      const denial = applyDenialReason(job, userId);
      if (denial === "NOT_FOUND")
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      if (denial === "NOT_PUBLISHED")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job is not open for applications",
        });
      if (denial === "OWN_JOB")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't apply to your own job",
        });

      return insertApplication({
        workOrderId: input.workOrderId,
        applicantId: userId,
        message: input.message,
      });
    }),

  /** Only the job's owner may see applicants. */
  listForJob: protectedProcedure
    .input(workOrderIdInput)
    .query(async ({ ctx, input }) => {
      const job = await getJobForApply(input.workOrderId);
      if (!job)
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      if (job.requesterId !== ctx.session.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      return listApplicationsForJob(input.workOrderId);
    }),

  /** The caller's own applications, plus their id so the UI can branch. */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return {
      userId,
      applications: await listApplicationsForApplicant(userId),
    };
  }),
});
