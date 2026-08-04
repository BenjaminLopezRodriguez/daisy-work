import {
  AssigneeType,
  BudgetType,
  RiskLevel,
  SubmissionStatus,
  WorkOrderStatus,
  type Submission,
  type WorkOrder,
} from "@/domain";
import {
  CURRENT_USER_ID,
  seedSubmissions,
  seedWorkOrders,
} from "../mocks/seed";
import type { CreateDraftInput, WorkOrderService } from "./types";
import {
  assignInputSchema,
  createDraftInputSchema,
  submitWorkInputSchema,
  workOrderIdSchema,
} from "./types";

const store: { workOrders: WorkOrder[]; submissions: Submission[] } = {
  workOrders: [...seedWorkOrders],
  submissions: [...seedSubmissions],
};

export function createMockWorkOrderService(): WorkOrderService {
  return {
    async createDraft(raw: CreateDraftInput) {
      const input = createDraftInputSchema.parse(raw);
      const wo: WorkOrder = {
        id: `wo_draft_${Date.now()}`,
        title: input.title,
        description: input.description,
        requesterId: input.requesterId,
        organizationId: null,
        assigneeType: AssigneeType.Unassigned,
        assigneeId: null,
        category: input.category,
        workMode: input.workMode,
        location: null,
        riskLevel: RiskLevel.L1,
        status: WorkOrderStatus.Draft,
        budgetType: BudgetType.Fixed,
        budgetAmount: input.budgetAmount,
        currency: input.currency,
        startsAt: null,
        dueAt: null,
        createdAt: new Date(),
      };
      store.workOrders.unshift(wo);
      return wo;
    },

    async publish(raw) {
      const { workOrderId } = workOrderIdSchema.parse(raw);
      const wo = store.workOrders.find((w) => w.id === workOrderId);
      if (!wo) throw new Error("Work order not found");
      wo.status = WorkOrderStatus.Published;
      return wo;
    },

    async assign(raw) {
      const input = assignInputSchema.parse(raw);
      const wo = store.workOrders.find((w) => w.id === input.workOrderId);
      if (!wo) throw new Error("Work order not found");
      wo.assigneeId = input.assigneeId;
      wo.assigneeType =
        input.assigneeType === "agent" ? AssigneeType.Agent : AssigneeType.Human;
      wo.status = WorkOrderStatus.Assigned;
      return wo;
    },

    async submit(raw) {
      const input = submitWorkInputSchema.parse(raw);
      const wo = store.workOrders.find((w) => w.id === input.workOrderId);
      if (!wo) throw new Error("Work order not found");
      const submission: Submission = {
        id: `sub_${Date.now()}`,
        workOrderId: wo.id,
        submittedBy: input.submittedBy,
        status: SubmissionStatus.Submitted,
        notes: input.notes ?? null,
        submittedAt: new Date(),
      };
      store.submissions.unshift(submission);
      wo.status = WorkOrderStatus.Submitted;
      return { workOrder: wo, submission };
    },

    async approve(raw) {
      const { workOrderId } = workOrderIdSchema.parse(raw);
      const wo = store.workOrders.find((w) => w.id === workOrderId);
      if (!wo) throw new Error("Work order not found");
      wo.status = WorkOrderStatus.Approved;
      return wo;
    },

    async getById(workOrderId) {
      return store.workOrders.find((w) => w.id === workOrderId) ?? null;
    },

    async listForUser(userId = CURRENT_USER_ID) {
      return store.workOrders.filter(
        (w) => w.requesterId === userId || w.assigneeId === userId,
      );
    },
  };
}
