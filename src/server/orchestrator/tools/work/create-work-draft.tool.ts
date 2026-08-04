import { z } from "zod";

import type { OrchestratorTool, ToolExecutionContext } from "../../orchestrator.types";
import { workPlanSchema } from "../../orchestrator.types";

const inputSchema = workPlanSchema.extend({
  requesterId: z.string(),
});

const outputSchema = z.object({
  draftId: z.string(),
});

export const createWorkDraftTool: OrchestratorTool<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "create_work_draft",
  description: "Create a Work Order draft from an approved plan",
  inputSchema,
  outputSchema,
  risk: "reversible_write",
  requiresConfirmation: false,
  async execute(context: ToolExecutionContext, input) {
    const draft = await context.services.createDraft({
      title: input.title,
      description: input.summary,
      requesterId: input.requesterId,
      category: input.category,
      workMode: input.workMode,
      budgetAmount: input.budgetAmount,
      currency: input.currency,
    });
    return { draftId: draft.id };
  },
};
