import "server-only";

import { and, desc, eq } from "drizzle-orm";

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
