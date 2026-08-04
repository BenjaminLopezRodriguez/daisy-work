import { createOrchestratorModel } from "./model/deepseek-orchestrator-model";
import type {
  OrchestratorInput,
  OrchestratorPlan,
  ToolExecutionContext,
  WorkPlan,
} from "./orchestrator.types";
import { createWorkDraftTool } from "./tools/work/create-work-draft.tool";

export async function planWorkFromMessage(
  input: OrchestratorInput,
): Promise<OrchestratorPlan> {
  const model = createOrchestratorModel();
  return model.plan(input);
}

export async function createDraftFromPlan(
  context: ToolExecutionContext,
  plan: WorkPlan,
  requesterId: string,
): Promise<{ draftId: string }> {
  return createWorkDraftTool.execute(context, {
    ...plan,
    requesterId,
  });
}

export type { OrchestratorPlan, WorkPlan, OrchestratorInput };
