import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  acceptApplication,
  applyDenialReason,
  getJobForApply,
  insertApplication,
  listApplicationsForApplicant,
  listApplicationsForJob,
} from "@/server/services/db/application";
import { notify } from "@/server/services/notify";
import { claimAdAttribution } from "@/server/services/payments";

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
      if (denial === "NOT_FOUND" || !job)
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

      const application = await insertApplication({
        workOrderId: input.workOrderId,
        applicantId: userId,
        message: input.message,
      });

      // Only on first submit — re-applying must not re-notify.
      if (application.created) {
        await notify({
          userId: job.requesterId,
          title: `New application on “${job.title}”`,
          body: `${ctx.session.user.name ?? "Someone"} applied to your job.`,
          href: `/work/${input.workOrderId}`,
        });
      }

      return application;
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

  /**
   * The job owner picks someone. This is the hinge of the whole marketplace:
   * it assigns the work order, closes the job to further applicants, and tells
   * everyone who applied where they stand.
   */
  accept: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const accepted = await acceptApplication(input.applicationId, userId);

      if (accepted === "NOT_FOUND")
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      if (accepted === "NOT_OWNER")
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your job" });
      if (accepted === "ALREADY_ASSIGNED")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job already has someone assigned",
        });

      // An ad that produced this hire is billable now. Recorded here, settled
      // out of the payout at release — never charged to a card that can fail.
      await claimAdAttribution({
        workOrderId: accepted.workOrderId,
        customerUserId: userId,
        providerUserId: accepted.applicantId,
      }).catch((error) => console.error("[ads] attribution failed", error));

      await notify({
        userId: accepted.applicantId,
        title: `You got the job: “${accepted.jobTitle}”`,
        body: "The customer accepted your application. Open it to get started.",
        href: `/work/${accepted.workOrderId}`,
      });

      // Everyone else deserves to know the job is closed, not left guessing.
      for (const other of accepted.declinedApplicantIds) {
        await notify({
          userId: other,
          title: `“${accepted.jobTitle}” went to someone else`,
          body: "The customer picked another applicant. Keep an eye out for new jobs.",
          href: "/marketplace",
        });
      }

      return { ok: true as const, workOrderId: accepted.workOrderId };
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
