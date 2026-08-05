import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/server/db";
import { applications, users, workOrders } from "@/server/db/schema";

export type ApplicationRow = typeof applications.$inferSelect;

export { applyDenialReason } from "./application.guard";

export async function getJobForApply(workOrderId: string) {
  const [row] = await db
    .select({
      id: workOrders.id,
      title: workOrders.title,
      requesterId: workOrders.requesterId,
      status: workOrders.status,
    })
    .from(workOrders)
    .where(eq(workOrders.id, workOrderId))
    .limit(1);
  return row ?? null;
}

/**
 * Idempotent: DB unique index is the source of truth; returns existing row on
 * retry. `created` tells the caller whether to fire side effects.
 */
export async function insertApplication(input: {
  workOrderId: string;
  applicantId: string;
  message?: string | null;
}): Promise<ApplicationRow & { created: boolean }> {
  const [inserted] = await db
    .insert(applications)
    .values({
      workOrderId: input.workOrderId,
      applicantId: input.applicantId,
      message: input.message ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted) return { ...inserted, created: true };

  const [existing] = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.workOrderId, input.workOrderId),
        eq(applications.applicantId, input.applicantId),
      ),
    )
    .limit(1);
  if (!existing) throw new Error("Failed to create application");
  return { ...existing, created: false };
}

export type AcceptFailure = "NOT_FOUND" | "NOT_OWNER" | "ALREADY_ASSIGNED";

/**
 * Accept one applicant and decline the rest, in a single transaction so a job
 * can never end up with two accepted applications or an assignee that nobody
 * agreed to.
 */
export async function acceptApplication(
  applicationId: string,
  actorId: string,
): Promise<
  | AcceptFailure
  | {
      applicantId: string;
      workOrderId: string;
      jobTitle: string;
      declinedApplicantIds: string[];
    }
> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        applicationId: applications.id,
        applicantId: applications.applicantId,
        workOrderId: workOrders.id,
        jobTitle: workOrders.title,
        requesterId: workOrders.requesterId,
        assigneeId: workOrders.assigneeId,
      })
      .from(applications)
      .innerJoin(workOrders, eq(workOrders.id, applications.workOrderId))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!row) return "NOT_FOUND";
    if (row.requesterId !== actorId) return "NOT_OWNER";
    if (row.assigneeId && row.assigneeId !== row.applicantId)
      return "ALREADY_ASSIGNED";

    await tx
      .update(applications)
      .set({ status: "accepted" })
      .where(eq(applications.id, applicationId));

    const declined = await tx
      .update(applications)
      .set({ status: "declined" })
      .where(
        and(
          eq(applications.workOrderId, row.workOrderId),
          ne(applications.id, applicationId),
          ne(applications.status, "declined"),
        ),
      )
      .returning({ applicantId: applications.applicantId });

    await tx
      .update(workOrders)
      .set({
        assigneeId: row.applicantId,
        assigneeType: "human",
        status: "assigned",
      })
      .where(eq(workOrders.id, row.workOrderId));

    return {
      applicantId: row.applicantId,
      workOrderId: row.workOrderId,
      jobTitle: row.jobTitle,
      declinedApplicantIds: declined.map((d) => d.applicantId),
    };
  });
}

export async function listApplicationsForJob(workOrderId: string) {
  return db
    .select({
      id: applications.id,
      workOrderId: applications.workOrderId,
      applicantId: applications.applicantId,
      message: applications.message,
      status: applications.status,
      createdAt: applications.createdAt,
      applicantName: users.name,
      applicantAvatar: users.avatar,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.applicantId))
    .where(eq(applications.workOrderId, workOrderId))
    .orderBy(desc(applications.createdAt));
}

export async function listApplicationsForApplicant(applicantId: string) {
  return db
    .select({
      id: applications.id,
      workOrderId: applications.workOrderId,
      message: applications.message,
      status: applications.status,
      createdAt: applications.createdAt,
      jobTitle: workOrders.title,
      jobStatus: workOrders.status,
    })
    .from(applications)
    .innerJoin(workOrders, eq(workOrders.id, applications.workOrderId))
    .where(eq(applications.applicantId, applicantId))
    .orderBy(desc(applications.createdAt));
}
