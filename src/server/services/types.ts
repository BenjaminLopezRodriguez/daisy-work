import { z } from "zod";
import type { Submission, WorkOrder } from "@/domain";

export const createDraftInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requesterId: z.string().min(1),
  category: z.string().min(1),
  workMode: z.enum(["remote", "on_site", "hybrid"]),
  budgetAmount: z.number().int().nonnegative(),
  currency: z.string().default("USD"),
});
export type CreateDraftInput = z.infer<typeof createDraftInputSchema>;

export const workOrderIdSchema = z.object({
  workOrderId: z.string().min(1),
});

export const assignInputSchema = workOrderIdSchema.extend({
  assigneeId: z.string().min(1),
  assigneeType: z.enum(["human", "agent"]),
});

export const submitWorkInputSchema = workOrderIdSchema.extend({
  submittedBy: z.string().min(1),
  notes: z.string().optional(),
});

export type WorkOrderService = {
  createDraft: (input: CreateDraftInput) => Promise<WorkOrder>;
  publish: (input: { workOrderId: string }) => Promise<WorkOrder>;
  assign: (input: z.infer<typeof assignInputSchema>) => Promise<WorkOrder>;
  submit: (
    input: z.infer<typeof submitWorkInputSchema>,
  ) => Promise<{ workOrder: WorkOrder; submission: Submission }>;
  approve: (input: { workOrderId: string }) => Promise<WorkOrder>;
  getById: (workOrderId: string) => Promise<WorkOrder | null>;
  listForUser: (userId: string) => Promise<WorkOrder[]>;
  listPublished: () => Promise<WorkOrder[]>;
};
