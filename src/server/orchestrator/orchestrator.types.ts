import { z } from "zod";

export type ToolRisk =
  | "read"
  | "reversible_write"
  | "consequential_write"
  | "financial"
  | "regulated";

export const orchestratorInputSchema = z.object({
  message: z.string().min(1),
  userId: z.string(),
  workOrderId: z.string().optional(),
});

export type OrchestratorInput = z.infer<typeof orchestratorInputSchema>;

export const workPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  category: z.string(),
  workMode: z.enum(["remote", "on_site", "hybrid"]),
  plainRequirements: z.array(z.string()),
  deliverables: z.array(z.string()),
  budgetAmount: z.number().int().nonnegative(),
  currency: z.string(),
  riskHint: z.string(),
  needsConfirmation: z.boolean(),
});

export type WorkPlan = z.infer<typeof workPlanSchema>;

export type OrchestratorPlan =
  | {
      kind: "ask_user";
      question: string;
    }
  | {
      kind: "work_draft";
      plan: WorkPlan;
      explanation: string;
    }
  | {
      kind: "unavailable";
      message: string;
    };

export interface OrchestratorModel {
  plan(input: OrchestratorInput): Promise<OrchestratorPlan>;
}

export type ToolExecutionContext = {
  userId: string;
  services: {
    createDraft: (input: {
      title: string;
      description: string;
      requesterId: string;
      category: string;
      workMode: "remote" | "on_site" | "hybrid";
      budgetAmount: number;
      currency: string;
    }) => Promise<{ id: string }>;
    publish: (input: { workOrderId: string }) => Promise<void>;
  };
};

export interface OrchestratorTool<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  risk: ToolRisk;
  requiresConfirmation: boolean;
  execute(context: ToolExecutionContext, input: TInput): Promise<TOutput>;
}
